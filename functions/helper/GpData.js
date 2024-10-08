const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path')
const { Parser } = require('json2csv');
const { Storage } = require('@google-cloud/storage');
const { users, pdf_email, labreport_data, lab_report, labreport_csv, ref_range_data, signedPdfs } = require("../models/index");
const { where } = require('sequelize');

// Create the credentials object from environment variables
// const googleCredentials = {
//   type: process.env.GCLOUT_TYPE,
//   project_id: process.env.GCLOUD_PROJECT_ID,
//   private_key_id: process.env.GCLOUD_PRIVATE_KEY_ID,
//   private_key: process.env.GCLOUD_PRIVATE_KEY,
//   client_email: process.env.GCLOUD_CLIENT_EMAIL,
//   client_id: process.env.GCLOUD_CLIENT_ID,
//   auth_uri: process.env.GCLOUD_AUTH_URI,
//   token_uri: process.env.GCLOUD_TOKEN_URI,
//   auth_provider_x509_cert_url: process.env.GCLOUD_AUTH_PROVIDER_X509_CERT_URL,
//   client_x509_cert_url: process.env.GCLOUD_CLIENT_X509_CERT_URL,
//   universe_domain: process.env.GCLOUD_UNIVERSE_DOMAIN
// };
// const googleCredentials = {
//   type: 'service_account',
//   project_id: process.env.GCLOUD_PROJECT_ID,
//   private_key_id: process.env.GCLOUD_PRIVATE_KEY_ID,
//   private_key: process.env.GCLOUD_PRIVATE_KEY,
//   client_email: process.env.GCLOUD_CLIENT_EMAIL,
//   client_id: process.env.GCLOUD_CLIENT_ID,
//   auth_uri: process.env.GCLOUD_AUTH_URI,
//   token_uri: process.env.GCLOUD_TOKEN_URI,
//   auth_provider_x509_cert_url: process.env.GCLOUD_AUTH_PROVIDER_X509_CERT_URL,
//   client_x509_cert_url: process.env.GCLOUD_CLIENT_X509_CERT_URL,
//   universe_domain: process.env.GCLOUD_UNIVERSE_DOMAIN,
// };

// console.log("Credentials Object:", googleCredentials);


// const storage = new Storage({ projectId: 'gp-data-1-0', credentials: googleCredentials });

/**
 * Uploads a PDF file to Google Cloud Storage and handles related file operations.
 * 
 * @param {string} pdfPath - The local file path to the PDF intended for upload.
 * @param {object} data - Metadata object containing identifiers like protocolId, subjectId, etc.
 * @returns {Promise<{pdfName: string, destination: string}>} - The name and destination of the uploaded PDF.
 * @throws {Error} - Throws an error if the file cannot be uploaded or post-upload operations fail.
 */
const UplaodFile = async (pdfPath, data) => {

  const googleCredentials = {
    type: 'service_account',
    project_id: 'gp-data-1-0',
    private_key_id: '79c72abd30e39d5c2459606246bb200fc0e950a2',
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCH99EaF/wXiceP\ni00TGXrW8JlQA0y/ONg2zsG8aK+9shLKFqZBiDmed9itWOUlHMwIfi7UyiRyyftE\ndbcs170jHSyrhr7RL64Z5aE1sA4eUKQYl2ZE1EnbT2lyCa98TuQlcRtyyuMcz23b\neVChRFeD4IZciJYvWlhTC0yPEl42rE6XzhZr59aVuad12Gu1eVIanI7gQodhnIrp\n+RXvROq8uZWhcpmxs5v0jx9gUJzLtooEF+Yfw0pu1f+ILoecWFX/Tp+2ciJ53TwE\nR1DLG73PPFop+KndudHR41oW2QZ6LSdEwZQ7YTu/WPRnNg3fHwwkTSPrBIrabgsh\nKCsrOeO5AgMBAAECggEAA71y9/gnV/492hKWJ0jiQ9cN/+ElW2sHfy4drrkaS293\nvELA+5NmaAKKguMro23o5Vto3kjPVZp9d0Rof7A8Ae3M+KIOAzr1O6hhEF+0QGHO\nD7tGEILejgzU8lJ2oaavDczFjo6VjnQcuhv6oNhRyB0qaPwcqyGzBVltrM+lKIpi\nIqBAnGXZcWrMfRCAaRLjMnzsdALIIJTxHKbZyesT2sWOdbFrHse1960Z1mSh6z3I\n4j/XaewwLmOEk4a3tZF/YR6P2RaeDyKl8LnhJ2JdjiJt+rMxc62QEQ4u5b0Jv6pY\nAqNw4qd4o5ftEBYGG1B1BInYcFr70CoWnUCnNy09QQKBgQC7b2NwR+Ett1CHGtZJ\n2XNuCTjPpwdZSeTx53PMwhqbgPOQ8Q5vxBfkDyjGMaUmfMvBylyAxNv5vDThlu0g\nKp1dSxVycL/diTBOvrl1FYCh7GKUGilw2frkbLuN+Nxz6CwBUv++jXFRKChKakEw\nMIY6FAOJkwcbbNbSnl7nu0DReQKBgQC5tLmkolwu555jFuANxDG7qRdCkrFaXAmC\nVZhUUMNow1/tuyXgzRIl3L1JBhVQlmCvSU2fseejQ8sCL2/p9/teMyhiD3K2G9Wb\ngqe9FLgj+YbgthzMB49qFeWfQ/EPUdI8nXDKsJo5z3IhpXeIpdYsotkR/Kpy4V8K\nW2ZmghFUQQKBgH3QVCgvJ5h/Pz+hJQwnOZM3/3lrfcRSlKpIGXPtKt0M3vGAzZb6\nQqsj/dOjyV6fUEpBonwRKDNnQPvYSk1YLY9M8hWCV1fGWbXR0j0kdNa8DKOrN/v3\nZbDkx7SRwrDOvJMa+m4XFWRLl1f0INPPDpp3irRTC+c91KlGAyB7khPJAoGBALO5\nZlkhENoMK0t23gw0rnUR5oL1eVMb89ABitU+/H8tZm+rSbNQhJnEEiTUEFjX0GaU\nKN2+zZFCkPxicIsdBldaZ2DP1pLMSWShhDkIDlYyrghX93K2dmOTIZGLrYbIBxHG\nxVxEol4EmE5b112WMbstN6uivktENjjN0EKw6piBAoGBAIVcVqhBk68/zoOZ4ltS\nSCe/Sb520+P8sdaUWxCeXS8KH+982fvOXxOe9AvzYd/Ko5vInqeUlTD9wBeTzdIY\nuufgvo4W4wKL3y5gdNosAPqbLbTXA7Fj3QnfNlVtqnrshSZBPATQ3ok+WCJMaLpp\nQsJdXWCsVEOmOg1YGfrn1ZXG\n-----END PRIVATE KEY-----\n",
    client_email: 'gpdata@gp-data-1-0.iam.gserviceaccount.com',
    client_id: '109836118774191843916',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/gpdata%40gp-data-1-0.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com',
  };
  
  
  console.log("Credentials Object:", googleCredentials);
  
  
  const storage = new Storage({ projectId: 'gp-data-1-0', credentials: googleCredentials });
  console.log("PDF Path:", pdfPath);
  console.log('File size:', fs.statSync(pdfPath).size, 'bytes');

  // Check if the PDF exists and is not empty before proceeding.
  if (!fs.existsSync(pdfPath)) {
    throw new Error('PDF file does not exist at the provided path.');
  }
  if (fs.statSync(pdfPath).size === 0) {
    throw new Error('The source PDF file is empty.');
  }

  // Ensure the file is readable.
  fs.accessSync(pdfPath, fs.constants.R_OK);

  // Extract and sanitize data fields to be used in the PDF file naming.
  const { protocolId, subjectId, investigator, timePoint } = data;
  const sanitizedProtocolId = protocolId.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedSubjectId = subjectId.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedInvestigator = investigator.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedTimePoint = timePoint.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");
  const pdfName = `${sanitizedProtocolId}.${sanitizedSubjectId}.${sanitizedInvestigator}.${sanitizedTimePoint}.${timestamp}.pdf`;
  // Define the storage destination.
  const bucketName = 'gpdata01';
  const destination = `pdf/${pdfName}`;
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(destination);

  try {
    // Upload the PDF file to Google Cloud Storage.
    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(pdfPath);
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: 'application/pdf',
        },
        resumable: false,  // Set resumable to false to prevent retries
        validation: false,
      });

      readStream.pipe(writeStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    console.log('File uploaded to Google Cloud Storage:', `https://storage.googleapis.com/${bucketName}/${destination}`);

    // Optionally delete the local file after successful upload.
    fs.unlink(pdfPath, (err) => {
      if (err) {
        console.error('Failed to delete the original PDF file:', err);
        throw err;
      }
      console.log('Original PDF file deleted successfully');
    });

    return { pdfName, destination };
  } catch (error) {
    console.error('Failed to upload PDF:', error);
    throw new Error('Failed to upload PDF: ' + error.message);
  }
};

const UploadFile = async (pdfUrl, data) => {
  const googleCredentials = {
    type: 'service_account',
    project_id: 'gp-data-1-0',
    private_key_id: '79c72abd30e39d5c2459606246bb200fc0e950a2',
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCH99EaF/wXiceP\ni00TGXrW8JlQA0y/ONg2zsG8aK+9shLKFqZBiDmed9itWOUlHMwIfi7UyiRyyftE\ndbcs170jHSyrhr7RL64Z5aE1sA4eUKQYl2ZE1EnbT2lyCa98TuQlcRtyyuMcz23b\neVChRFeD4IZciJYvWlhTC0yPEl42rE6XzhZr59aVuad12Gu1eVIanI7gQodhnIrp\n+RXvROq8uZWhcpmxs5v0jx9gUJzLtooEF+Yfw0pu1f+ILoecWFX/Tp+2ciJ53TwE\nR1DLG73PPFop+KndudHR41oW2QZ6LSdEwZQ7YTu/WPRnNg3fHwwkTSPrBIrabgsh\nKCsrOeO5AgMBAAECggEAA71y9/gnV/492hKWJ0jiQ9cN/+ElW2sHfy4drrkaS293\nvELA+5NmaAKKguMro23o5Vto3kjPVZp9d0Rof7A8Ae3M+KIOAzr1O6hhEF+0QGHO\nD7tGEILejgzU8lJ2oaavDczFjo6VjnQcuhv6oNhRyB0qaPwcqyGzBVltrM+lKIpi\nIqBAnGXZcWrMfRCAaRLjMnzsdALIIJTxHKbZyesT2sWOdbFrHse1960Z1mSh6z3I\n4j/XaewwLmOEk4a3tZF/YR6P2RaeDyKl8LnhJ2JdjiJt+rMxc62QEQ4u5b0Jv6pY\nAqNw4qd4o5ftEBYGG1B1BInYcFr70CoWnUCnNy09QQKBgQC7b2NwR+Ett1CHGtZJ\n2XNuCTjPpwdZSeTx53PMwhqbgPOQ8Q5vxBfkDyjGMaUmfMvBylyAxNv5vDThlu0g\nKp1dSxVycL/diTBOvrl1FYCh7GKUGilw2frkbLuN+Nxz6CwBUv++jXFRKChKakEw\nMIY6FAOJkwcbbNbSnl7nu0DReQKBgQC5tLmkolwu555jFuANxDG7qRdCkrFaXAmC\nVZhUUMNow1/tuyXgzRIl3L1JBhVQlmCvSU2fseejQ8sCL2/p9/teMyhiD3K2G9Wb\ngqe9FLgj+YbgthzMB49qFeWfQ/EPUdI8nXDKsJo5z3IhpXeIpdYsotkR/Kpy4V8K\nW2ZmghFUQQKBgH3QVCgvJ5h/Pz+hJQwnOZM3/3lrfcRSlKpIGXPtKt0M3vGAzZb6\nQqsj/dOjyV6fUEpBonwRKDNnQPvYSk1YLY9M8hWCV1fGWbXR0j0kdNa8DKOrN/v3\nZbDkx7SRwrDOvJMa+m4XFWRLl1f0INPPDpp3irRTC+c91KlGAyB7khPJAoGBALO5\nZlkhENoMK0t23gw0rnUR5oL1eVMb89ABitU+/H8tZm+rSbNQhJnEEiTUEFjX0GaU\nKN2+zZFCkPxicIsdBldaZ2DP1pLMSWShhDkIDlYyrghX93K2dmOTIZGLrYbIBxHG\nxVxEol4EmE5b112WMbstN6uivktENjjN0EKw6piBAoGBAIVcVqhBk68/zoOZ4ltS\nSCe/Sb520+P8sdaUWxCeXS8KH+982fvOXxOe9AvzYd/Ko5vInqeUlTD9wBeTzdIY\nuufgvo4W4wKL3y5gdNosAPqbLbTXA7Fj3QnfNlVtqnrshSZBPATQ3ok+WCJMaLpp\nQsJdXWCsVEOmOg1YGfrn1ZXG\n-----END PRIVATE KEY-----\n",
    client_email: 'gpdata@gp-data-1-0.iam.gserviceaccount.com',
    client_id: '109836118774191843916',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/gpdata%40gp-data-1-0.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com',
  };
  
  
  console.log("Credentials Object:", googleCredentials);
  
  
  const storage = new Storage({ projectId: 'gp-data-1-0', credentials: googleCredentials });
  console.log("insdie uplaod", pdfUrl, data)
  const newName = data.name;

  // Temporarily download the PDF to a local path
  const localPath = path.join(__dirname, 'uploads');
  const writer = fs.createWriteStream(localPath);

  try {
    const response = await axios({
      url: pdfUrl,
      method: 'GET',
      responseType: 'stream'
    });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Upload the PDF file to Google Cloud Storage
    const bucketName = 'gpdata01';
    const destination = `signedPdf/${newName}`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(destination);
    await file.save(fs.readFileSync(localPath), {
      metadata: { contentType: 'application/pdf' },
    });

    console.log('File uploaded to Google Cloud Storage:', `https://storage.googleapis.com/${bucketName}/${destination}`);

    // Update the record in the database
    const pdfRecord = await signedPdfs.findOne({ where: { pdf_id: data.id } });
    const pdfEmailId = pdfRecord.dataValues.pdfEmailIdfk
    console.log("record", pdfRecord.dataValues.pdfEmailIdfk)
    const userEmail = await pdf_email.findOne({
      where: {
        id: pdfEmailId
      }
    })
    const email_to = userEmail.dataValues.email_to
    console.log("userEmail", userEmail)
    const pdfEmailUpdate = await pdf_email.update({ isSigned: true },
      {
        where: {
          id: pdfEmailId,
        },
      },)
    if (pdfRecord) {
      await pdfRecord.update({ pdfUrl: destination, isSigned: true, email_to: email_to });
      console.log('Database updated successfully with new PDF URL');
    }

    // Optionally delete the local file
    fs.unlinkSync(localPath);
    console.log('Local PDF file deleted successfully');

    return { pdfName: newName, destination: `https://storage.googleapis.com/${bucketName}/${destination}` };
  } catch (error) {
    console.error('Failed to process PDF:', error);
    throw new Error('Failed to process PDF: ' + error.message);
  }
};

/**
 * Creates a record for a PDF email transaction in the database.
 * 
 * @param {string} Received - The timestamp when the email was received.
 * @param {string} pdfname - The name of the PDF file.
 * @param {string} destination - The storage destination of the PDF.
 * @param {string} To - The email address of the recipient/user.
 * @returns {Promise<{pdfEmailId: number}>} - Returns the ID of the created PDF email record.
 * @throws {Error} - Throws an error if the operation fails, particularly if the user is not found.
 */
const PdfEmail = async (Received, pdfname, destination, To) => {
  try {
    // Attempt to fetch the user based on the email provided.
    const user = await users.findOne({ where: { user_email: To } });
    // If the user is not found, throw an error indicating the user does not exist.
    if (!user) {
      throw new Error('User not found');
    }

    // Use the user's ID from the retrieved user object for linking in the pdf_email table.
    const userEmailFk = user.id;

    // Create a new pdf_email record using the provided and fetched data.
    console.log("pdf upload query,line 186")
    const pdfEmail = await pdf_email.create({
      email_to: To,
      receivedAt: Received,
      pdfName: pdfname,
      pdfPath: destination,
      userEmailFk: userEmailFk,
    });

    // Retrieve the ID of the newly created pdf_email record.
    const pdfEmailId = pdfEmail.id;

    // Return the ID of the created record.
    return { pdfEmailId };
  } catch (error) {
    // Log the error and rethrow it for further handling by the caller.
    console.error('Error in PdfEmail function:', error);
    throw error;
  }
};

/**
 * Inserts or updates lab report data based on existing records.
 * 
 * @param {object} extractedData - The lab report data extracted, containing multiple properties.
 * @param {string} email_to - Email address of the user to which the lab report will be associated.
 * @returns {Promise<{message: string, datamade?: object}>} - Returns a message indicating whether new data needs to be added or skipped and the data to be added if applicable.
 */
const insertOrUpdateLabReport = async (extractedData, email_to) => {
  // Use map to transform each test into a promise that resolves to the test's existence check.
  console.log("inserting and updating all labdata line  216")
  const labReportsPromises = extractedData.tests.map(async (test) => {
    console.log("Testing:", test);
    // Query the database to find matching lab report data for each test.
    const reports = await lab_report.findAll({
      where: {
        protocolId: extractedData.protocolId,
        subjectId: extractedData.subjectId,
        email_to: email_to,
        timePoint: extractedData.timePoint,
        time_of_collection: extractedData.timeOfCollection,
        dateOfCollection: extractedData.dateOfCollection
      },
      include: [{
        model: labreport_data,
        as: 'labreport_data',
        where: { lab_name: test.lab_name, value: test.value },
        required: true,
      }]
    });
    // Return an object summarizing the test and whether it was found.
    return {
      lab_provider: "Medpace",  // Constant provider name for all entries
      lab_name: test.lab_name,  // Name of the test
      value: test.value,        // Value of the test
      refValue: test.refValue,  // Reference value of the test
      found: reports.length > 0 // Boolean indicating if any matching records were found
    };
  });

  // Resolve all promises to determine the existence of all tests.
  const labReports = await Promise.all(labReportsPromises);

  // Identify tests that did not match existing records.
  const unmatchedTests = labReports.filter(report => !report.found);

  // If there are unmatched tests, prepare data for adding new records.
  if (unmatchedTests.length > 0) {
    console.log("Some tests did not match existing records. Adding new data for:", unmatchedTests.map(test => `${test.lab_name} with value ${test.value}`));
    let datamade = {
      protocolId: extractedData.protocolId,
      investigator: extractedData.investigator,
      subjectId: extractedData.subjectId,
      dateOfCollection: extractedData.dateOfCollection,
      timePoint: extractedData.timePoint,
      timeOfCollection: extractedData.timeOfCollection,
      tests: unmatchedTests
    };
    return { message: "Add", datamade }; // Return 'Add' message with data to be added.
  } else {
    console.log("All tests match existing records. Skipping data insertion.");
    return { message: "Skip" }; // Return 'Skip' message if all tests are found.
  }
};


/**
 * Creates a new lab report record in the database and links it to an existing PDF email record.
 * 
 * @param {object} data - The lab report data including protocol, investigator, etc.
 * @param {number} pdfEmailId - The ID of the associated PDF email, used as a foreign key.
 * @param {string} To - The email address associated with the lab report.
 * @returns {Promise<{labReportId: number}>} - The ID of the newly created lab report.
 * @throws {Error} - Throws an error if the lab report cannot be created.
 */
const labReport = async (data, pdfEmailId, To) => {
  try {
    // Validate input data for completeness
    if (!data || !pdfEmailId || !To) {
      throw new Error('Missing data for creating lab report');
    }
    console.log("adding lab data in lab_report line 287")
    // Attempt to create a lab_report record with the provided data and link it to the specified pdf_email ID
    const labReport = await lab_report.create({
      protocolId: data.protocolId,
      investigator: data.investigator,
      email_to: To,
      subjectId: data.subjectId,
      dateOfCollection: data.dateOfCollection,
      timePoint: data.timePoint,
      time_of_collection: data.timeOfCollection,
      pdfEmailIdfk: pdfEmailId, // Ensure this field name matches your database schema
    });

    // Extract the ID of the newly created lab report
    const labReportId = labReport.id;

    // Return the ID of the new lab report
    return { labReportId };
  } catch (error) {
    // Log any errors encountered during the creation of the lab report
    console.error('Failed to create lab report:', error);
    throw new Error('Failed to create lab report: ' + error.message);
  }
};


/**
 * Processes and saves lab report data along with associated reference range data.
 * 
 * @param {Array} labDataArray - Array of lab data entries to be processed and saved.
 * @param {number} labReportId - The ID of the lab report these data entries belong to.
 * @returns {Promise<void>} - A promise that resolves when all operations are completed.
 */
const labReoprtData = async (labDataArray, labReportId,pdfEmailIdFk) => {
  try {
    console.log("Processing lab data:", labDataArray);

    console.log("adding labreportdata in lab_report line 287")

    // Map to store processed combinations for reference range data, avoiding duplicate entries.
    const refRangeDataMap = new Map();

    // Handle the reference range data entries first.
    for (const data of labDataArray) {
      const { lab_provider, lab_name, refValue } = data;
      const mapKey = `${lab_provider}_${lab_name}`; // Create a unique key for the map.
  
      if (!refRangeDataMap.has(mapKey)) {
          // Find existing reference range data or create a new one if it doesn't exist.
          let refRangeData = await ref_range_data.findOne({
              where: { lab_name, labProvider: lab_provider }
          });
  
          if (!refRangeData) {
              // If no existing data, create a new entry.
              refRangeData = await ref_range_data.create({ lab_name, labProvider: lab_provider, refValue });
          } else if (refRangeData.refValue !== refValue) {
              // If existing data has a different refValue, update it.
              await ref_range_data.update({ refValue }, {
                  where: { id: refRangeData.id }
              });
              refRangeData.refValue = refValue; // Update the local cache of object to reflect new refValue
          }
  
          refRangeDataMap.set(mapKey, refRangeData.id); // Store the reference range data ID in the map.
      }
  }

    // Process and save each lab report data entry.
    const saveOperations = labDataArray.map(async (data) => {
      const { lab_provider, lab_name, value, isPending } = data;
      const mapKey = `${lab_provider}_${lab_name}`;
      const refRangeDataId = refRangeDataMap.get(mapKey); // Get the foreign key from the map.

      // Create and save the lab report data.
      return labreport_data.create({
        labReoprtFk: labReportId,
        lab_name,
        value,
        isPending,
        pdfEmailIdFk:pdfEmailIdFk,
        refRangeFk: refRangeDataId // Use the refRangeDataId as a foreign key.
      });
    });

    // Wait for all lab report data entries to be saved.
    const savedData = await Promise.all(saveOperations);
    console.log("Saved lab report data:", savedData);
  } catch (error) {
    // Log and rethrow the error for further handling.
    console.error("Failed to process lab report data:", error);
    throw error; // Rethrowing the error to be handled by the caller.
  }
};

/**
 * Converts lab report data into a CSV file and uploads it to Google Cloud Storage.
 * 
 * @param {number} id - The foreign key reference to the lab report.
 * @param {object} data - Contains information like protocolId, subjectId, etc.
 * @returns {Promise<{message: string, url?: string, error?: string}>} - The result of the CSV creation and upload process.
 */
const MakeCsv = async (id, data) => {
  const { protocolId, subjectId, investigator, timePoint } = data;
  try {
    // Fetch related lab report data from the database.
    const fetchedData = await labreport_data.findAll({
      where: { labReoprtFk: id },
      include: [{
        model: ref_range_data,
        as: 'refRangeData',
        attributes: ['refValue']
      }]
    });

    // Check if data is available to process.
    if (fetchedData.length === 0) {
      return { message: 'No data found' };
    }

    // Map the fetched data into a format suitable for CSV conversion.
    const jsonData = fetchedData.map(record => ({
      id: record.id,
      lab_name: record.lab_name,
      value: record.value,
      refValue: record.refRangeData ? record.refRangeData.refValue : '',
      isPending: record.isPending,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));

    // Define fields for the CSV.
    const fields = ['id', 'lab_name', 'value', 'refValue', 'isPending', 'createdAt', 'updatedAt'];
    const opts = { fields };

    // Use the json2csv library to convert JSON to CSV.
    const parser = new Parser(opts);
    const csv = parser.parse(jsonData);

    // Sanitize inputs to be safe for use in file paths.
    const sanitizedData = [protocolId, subjectId, investigator, timePoint].map(item =>
      item.replace(/[^a-zA-Z0-9]/g, '_')
    );
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");
    const csvName = `${sanitizedData.join('.')}_${timestamp}.csv`;
    const bucketName = 'gpdata01';
    const destination = `reports/${csvName}`;

    // Prepare the file for upload.
    const buffer = Buffer.from(csv, 'utf-8');
    const file = storage.bucket(bucketName).file(destination);
    await file.save(buffer, { contentType: 'text/csv' });

    // Optionally record the CSV creation in your database.
    await labreport_csv.create({ labReoprtFk: id, csvPath: destination });

    // Construct the public URL to the uploaded file.
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
    return { message: 'CSV file created and uploaded successfully', url: publicUrl };
  } catch (error) {
    console.error('Error creating or uploading CSV:', error);
    return { error: 'Error creating or uploading CSV' };
  }
};


/**
 * Sends a PDF file to a specified API endpoint and processes the response.
 *
 * @param {string} pdfPath - The file path of the PDF to be sent.
 * @param {string} apiUrl - The URL of the API endpoint that will process the PDF.
 * @returns {Promise<{data: object | null}>} - The processed data from the API or null in case of an error.
 */
const pdfProcessor = async (pdfPath, apiUrl) => {
  // Prepare the form data with the PDF file.
  const formData = new FormData();
  formData.append('file', fs.createReadStream(pdfPath), {
    contentType: 'application/pdf', // Explicitly set the MIME type for the PDF file.
  });

  try {
    // Send the PDF to the specified API using axios.
    const response = await axios.post(apiUrl, formData, {
      headers: {
        ...formData.getHeaders(), // Include the necessary headers for multipart/form-data.
      },
    });

    // Check if the response from the API is valid and contains data.
    if (response && response.data) {
      console.log('PDF sent successfully:', response.data);
      return { data: response.data }; // Return the data received from the API.
    } else {
      console.log('No data returned from the API');
      return { data: {} }; // Return an empty object if no data is received, to maintain consistency in return type.
    }
  } catch (error) {
    // Log any errors encountered during the API call.
    console.error('Error sending PDF:', error.message);
    return { data: null }; // Return null to signify an error condition, simplifying error handling for the caller.
  }
};

/**
 * Sends a PDF file to an API for logo extraction and processes the returned data.
 *
 * @param {string} pdfPath - The file path of the PDF to be analyzed.
 * @param {string} apiUrl - The URL of the API endpoint that will process the PDF for logo extraction.
 * @returns {Promise<{logo: object | null}>} - The extracted logo data from the PDF, or null in case of an error.
 */
const logoExtraction = async (pdfPath, apiUrl) => {
  // Initialize FormData to send the file with the correct headers.
  const formData = new FormData();
  formData.append('file', fs.createReadStream(pdfPath), {
    contentType: 'application/pdf', // Explicitly set the MIME type to 'application/pdf'.
  });

  try {
    // Make an HTTP POST request to the specified API endpoint.
    const response = await axios.post(apiUrl, formData, {
      headers: {
        ...formData.getHeaders(), // Include the necessary headers for multipart/form-data.
      },
    });

    // Check if the API response is valid and contains data.
    if (response && response.data) {
      console.log('PDF sent successfully for logo extraction:', response.data);
      return { logo: response.data }; // Return the logo data received from the API.
    } else {
      console.log('No data returned from the logo extraction API');
      return { logo: {} }; // Return an empty object if no data is received, to maintain consistency in return type.
    }
  } catch (error) {
    // Log any errors encountered during the API call.
    console.error('Error sending PDF for logo extraction:', error.message);
    return { logo: null }; // Return null to signify an error condition, simplifying error handling for the caller.
  }
};

const coordinateExtraction = async (pdfUrl, apiUrl) => {
  // Prepare JSON data with the file URL.
  const data = JSON.stringify({
    "file_url": pdfUrl
  });

  let config = {
    method: 'post',
    url: apiUrl,
    headers: { 
      'Content-Type': 'application/json' // Set header to application/json
    },
    data: data
  };

  try {
    // Make an HTTP POST request to the specified API endpoint using the config.
    const response = await axios.request(config);

    // Check if the API response is valid and contains data.
    if (response && response.data) {
      console.log('Coordinates received from API:', response.data);
      return { coordinates: response.data }; // Return the data received from the API.
    } else {
      console.log('No data returned from the coordinate extraction API');
      return { coordinates: {} }; // Return an empty object if no data is received, to maintain consistency in return type.
    }
  } catch (error) {
    // Log any errors encountered during the API call.
    console.error('Error retrieving coordinates from API:', error.message);
    return { coordinates: null }; // Return null to signify an error condition, simplifying error handling for the caller.
  }
};


// const reformData = async (Data)=>{
//     const formattedData = [];

//     Data.forEach(item => {
//         if (item.type === 'Tests') {
//             // Assuming each 'Tests' entry has a 'properties' array that contains the actual test details.
//             item.properties.forEach(test => {
//                 // This part depends on how the properties are structured which is not fully shown in your data.
//                 // Assuming each test has a structured similar to the desired format.
//                 formattedData.push({
//                     type: 'Tests',
//                     properties: [
//                         { type: 'Ref_Range', mentionText: test.refRange },
//                         { type: 'Result', mentionText: test.result },
//                         { type: 'Test', mentionText: test.testName }
//                     ]
//                 });
//             });
//         } else {
//             // For non-test items, push them directly into the formatted data array
//             formattedData.push({
//                 type: item.type,
//                 mentionText: item.mentionText
//             });
//         }
//     });

//     return {formattedData};
// }

/**
 * Finds and updates lab reports based on extracted data.
 * 
 * @param {object} extractedData - Data containing identifiers and tests to find and update lab reports.
 * @param {string} email_to - Email identifier for lab report filtering.
 * @returns {Promise<object>} - A promise that resolves to the updated lab reports or an error message.
 */
const findAllLabData = async (extractedData, email_to,newPdfUrl ,pdfEmailId) => {
  try {
    console.log("finding all labdata line  598")
    const Labreports = await Promise.all(extractedData.tests.map(async (name) => {
      return lab_report.findAll({
        where: {
          protocolId: extractedData.protocolId,
          subjectId: extractedData.subjectId,
          email_to: email_to,
          timePoint: extractedData.timePoint,
          time_of_collection: extractedData.timeOfCollection,
          dateOfCollection: extractedData.dateOfCollection
        },
        include: [{
          model: labreport_data,
          as: 'labreport_data',
          where: { lab_name: name.lab_name },
          required: true,
        }]
      });
    }));

    console.log("Data collected:", Labreports);

    const updateLabReports = async (Labreports, extractedData) => {
      try {
        const updatedRecords = [];

        // Iterate over each report in Labreports array
        for (const reportArray of Labreports) {
          for (const report of reportArray) {
            for (const labData of report.labreport_data) {
              // Find the corresponding test data from extractedData
              const testData = extractedData.tests.find(test => test.lab_name === labData.lab_name);

              if (testData) {
                // Store original data
                const originalData = { ...labData.dataValues };

                // Check if existing value is not empty and new value is "Pending"
                if (labData.value && testData.value === "Pending") {
                  console.log("Skipping update for", labData.lab_name, "as new data is 'Pending' and old data is not empty.");
                  continue; // Skip this iteration, thus not updating the value to "Pending"
                }
                console.log("datttaaaaaa",report.dataValues.pdfEmailIdfk)
                console.log("urlllllllllllll",newPdfUrl)
                console.log("pdf new id",pdfEmailId)
                const pdfEmailIdfk = report.dataValues.pdfEmailIdfk
                // Perform update
                await labData.update({ value: testData.value ,pdfEmailIdFk:pdfEmailId});
                // const pdfEmailRecord = await pdf_email.update({
                //   pdfPath:newPdfUrl
                // },
                // {
                //   where:{
                //     id:pdfEmailIdfk
                //   }
                // }
              // );
            
                // Store updated data
                const updatedData = { ...labData.dataValues };

                // Collect original and updated data
                updatedRecords.push({
                  originalData,
                  updatedData
                });
              }
            }
          }
        }

        console.log("All lab data values updated successfully.", updatedRecords);
        return updatedRecords;  // Return details of updates
      } catch (error) {
        console.error("Error updating lab data values:", error);
        throw error;  // Re-throw to handle it later if necessary
      }
    }

    await updateLabReports(Labreports, extractedData);

    return { Labreports };
  } catch (error) {
    console.log("Error occurred:", error);
    return { error: error.message };
  }
}



module.exports = {
  UplaodFile,
  PdfEmail,
  labReport,
  labReoprtData,
  MakeCsv,
  pdfProcessor,
  findAllLabData,
  insertOrUpdateLabReport,
  logoExtraction,
  UploadFile,
  coordinateExtraction
};
