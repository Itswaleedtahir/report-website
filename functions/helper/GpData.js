const axios = require('axios');
const { Storage } = require('@google-cloud/storage');
const {pdf_email,labreport_data ,lab_report,labreport_email,ref_range_data} = require("../models/index");

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

const UplaodFile = async (Attachment, From) => {
  try {
    // Generate a file name using the email and timestamp
    const sanitizedEmail = From.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const bucketName = 'gpdata01'; // Replace with your bucket name
    const pdfname = `${sanitizedEmail}_${timestamp}.pdf`;
    const destination = `pdf/${pdfname}`;

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

const PdfEmail = async(From,Received,pdfname,destination)=>{

         // Create pdf_email record
    const pdfEmail = await pdf_email.create({
        emailAddress: From,
        receivedAt: Received,
        pdfName: pdfname,
        pdfPath: destination,
      });
      const pdfEmailId = pdfEmail.id;
      return { pdfEmailId };
}

const labReport = async (data,pdfEmailId)=>{

     // Create a lab_report record linked to pdf_email
     const labReport = await lab_report.create({
        protocolId: data.protocolId,
        investigator: data.investigator,
        subjectId: data.subjectId,
        dateOfCollection: data.dateOfCollection,
        timePoint: data.timePoint,
        pdfEmailIdfk: pdfEmailId, // Assuming pdfEmailId is the primary key of pdf_email
      });

       const labReportId = labReport.id;
       return {labReportId}
}

module.exports = {
  UplaodFile,
  PdfEmail,
  labReport
};
