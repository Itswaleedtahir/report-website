const axios = require('axios');
const { Parser } = require('json2csv');
const { Storage } = require('@google-cloud/storage');
const {users,pdf_email,labreport_data ,lab_report,labreport_csv,ref_range_data} = require("../models/index");

// Create the credentials object from environment variables
const googleCredentials = {
  type: process.env.GCLOUT_TYPE,
  project_id: process.env.GCLOUD_PROJECT_ID,
  private_key_id: process.env.GCLOUD_PRIVATE_KEY_ID,
  private_key: process.env.GCLOUD_PRIVATE_KEY,
  client_email: process.env.GCLOUD_CLIENT_EMAIL,
  client_id: process.env.GCLOUD_CLIENT_ID,
  auth_uri: process.env.GCLOUD_AUTH_URI,
  token_uri: process.env.GCLOUD_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GCLOUD_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GCLOUD_CLIENT_X509_CERT_URL,
  universe_domain: process.env.GCLOUD_UNIVERSE_DOMAIN
};

const storage = new Storage({ projectId: 'gp-data-1-0', credentials: googleCredentials });

const UplaodFile = async (Attachment,data) => {
    const { protocolId, subjectId, investigator, timePoint } = data;

    // Sanitize the input data to ensure they can be used in a file name
    const sanitizedProtocolId = protocolId.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedSubjectId = subjectId.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedInvestigator = investigator.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedTimePoint = timePoint.replace(/[^a-zA-Z0-9]/g, '_');
    
   // Generate the timestamp
   const timestamp = new Date().toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");


    // Generate the file name using the naming rule
    const pdfname = `${sanitizedProtocolId}.${sanitizedSubjectId}.${sanitizedInvestigator}.${sanitizedTimePoint}.${timestamp}.pdf`;
    const bucketName = 'gpdata01'; // Replace with your bucket name
    const destination = `pdf/${pdfname}`;
    
    try {
      // Create a write stream to Google Cloud Storage
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(destination);
      const writeStream = file.createWriteStream();
    
      // Download the file from the attachment URL and pipe it directly to the Cloud Storage write stream
      const response = await axios({
        url: Attachment,
        method: 'GET',
        responseType: 'stream',
      });
    
      await new Promise((resolve, reject) => {
        response.data.pipe(writeStream)
          .on('error', reject)
          .on('finish', resolve);
      });
    
      // Return details after upload completes successfully
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
      console.log('File uploaded to Google Cloud Storage successfully.', publicUrl);
      return { pdfname, destination };
    
    } catch (err) {
      console.error("Error uploading file:", err);
      throw err;
    }
    
};

const PdfEmail = async (Received, pdfname, destination, To) => {
  try {
    // Fetch the user ID from the users table
    const user = await users.findOne({ where: { user_email: To } });
    if (!user) {
      throw new Error('User not found');
    }

    const userEmailFk = user.id;

    // Create pdf_email record
    const pdfEmail = await pdf_email.create({
      email_to: To,
      receivedAt: Received,
      pdfName: pdfname,
      pdfPath: destination,
      userEmailFk: userEmailFk,
    });

    const pdfEmailId = pdfEmail.id;
    return { pdfEmailId };
  } catch (error) {
    console.error('Error in PdfEmail function:', error);
    throw error;
  }
};

const labReport = async (data,pdfEmailId,To)=>{

     // Create a lab_report record linked to pdf_email
     const labReport = await lab_report.create({
        protocolId: data.protocolId,
        investigator: data.investigator,
        email_to:To,
        subjectId: data.subjectId,
        dateOfCollection: data.dateOfCollection,
        timePoint: data.timePoint,
        pdfEmailIdfk: pdfEmailId, // Assuming pdfEmailId is the primary key of pdf_email
      });

       const labReportId = labReport.id;
       return {labReportId}
}

const labReoprtData = async(labDataArray,labReportId)=>{
try {
   // Create a map to store processed combinations for ref_range_data
   const refRangeDataMap = new Map();

   // First, handle the ref_range_data entries
   for (const data of labDataArray) {
       const { lab_provider, lab_name, refValue } = data;

       // Create a unique key for the map
       const mapKey = `${lab_provider}_${lab_name}`;

       // Check if the key and lab_provider exist in the map
       if (!refRangeDataMap.has(mapKey)) {
           let refRangeData = await ref_range_data.findOne({ 
               where: { 
                 lab_name: lab_name, 
                   labProvider: lab_provider 
               } 
           });

           // If it doesn't exist in the database, create it
           if (!refRangeData) {
               refRangeData = await ref_range_data.create({ lab_name: lab_name, labProvider: lab_provider, refValue: refValue });
           }

           // Store the primary key in the map
           refRangeDataMap.set(mapKey, refRangeData.id); // Ensure to use the correct attribute
       }
   }
   let labreportDataId 
   // Now, handle the labreport_data entries
   const saveOperations = labDataArray.map(async (data) => {
       const { lab_provider, lab_name, value, isPending } = data;

       // Create a unique key for the map
       const mapKey = `${lab_provider}_${lab_name}`;

       // Get the foreign key from the map
       const refRangeDataId = refRangeDataMap.get(mapKey);

       // Save the lab report data with the foreign key from ref_range_data
       return labreport_data.create({
           labReoprtFk: labReportId,
           lab_name: lab_name,
           value: value,
           isPending: isPending,
           refRangeFk: refRangeDataId // Assuming id is the primary key of ref_range_data
       });
   });

   // Execute all save operations
   const savedData = await Promise.all(saveOperations);
   console.log(savedData);
} catch (error) {
  console.log(error)
  return error
}
}

const MakeCsv = async (id, data) => {
  try {
    const { protocolId, subjectId, investigator, timePoint } = data;

    // Fetch the data from the database including ref_range_data
    const fetchedData = await labreport_data.findAll({
      where: {
        labReoprtFk: id,
      },
      include: [
        {
          model: ref_range_data,
          as: 'refRangeData', // Alias for the association
          attributes: ['refValue'] // Include specific attributes if needed
        }
      ]
    });

    if (fetchedData.length === 0) {
      return { message: 'No data found' };
    }

    // Convert the data to JSON format
    const jsonData = fetchedData.map(record => {
      // Access ref_range_data attributes via the alias 'refRangeData'
      return {
        id: record.id,
        lab_name: record.lab_name,
        value: record.value,
        refValue: record.refRangeData ? record.refRangeData.refValue : '', // Access refValue from ref_range_data
        isPending: record.isPending,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      };
    });

    // Define fields for CSV, excluding labReoprtFk and protocolId
    const fields = ['lab_name', 'value', 'refValue', 'isPending', 'createdAt', 'updatedAt'];
    const opts = { fields };

    // Convert JSON to CSV
    const parser = new Parser(opts);
    const csv = parser.parse(jsonData);

    // Sanitize the input data to ensure they can be used in a file name
    const sanitizedProtocolId = protocolId.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedSubjectId = subjectId.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedInvestigator = investigator.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedTimePoint = timePoint.replace(/[^a-zA-Z0-9]/g, '_');

    // Generate the timestamp
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");

    // Generate the file name using the naming rule
    const csvName = `${sanitizedProtocolId}.${sanitizedSubjectId}.${sanitizedInvestigator}.${sanitizedTimePoint}_${timestamp}.csv`;
    const bucketName = 'gpdata01'; // Replace with your bucket name
    const destination = `reports/${csvName}`;

    // Create a buffer from the CSV string
    const buffer = Buffer.from(csv, 'utf-8');

    // Upload the buffer to Google Cloud Storage
    const file = storage.bucket(bucketName).file(destination);
    await file.save(buffer, {
      contentType: 'text/csv',
    });

    // Save email record in the database
    await labreport_csv.create({
      labReoprtFk: id,
      csvPath: destination,
    });

    // Respond with the URL to the uploaded file
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

    return { message: 'CSV file created and uploaded', url: publicUrl };
  } catch (error) {
    console.error('Error creating or uploading CSV:', error);
    return { error: 'Error creating or uploading CSV' };
  }
}



module.exports = {
  UplaodFile,
  PdfEmail,
  labReport,
  labReoprtData,
  MakeCsv
};
