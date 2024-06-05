const { exec } = require('child_process');
const {onRequest} = require("firebase-functions/v2/https");
const { Datas, pdf_email,labreport_data ,lab_report,labreport_email} = require("../functions/models/index");
const { Storage } = require('@google-cloud/storage');
const { Parser } = require('json2csv');
const path = require('path');

const fs = require('fs');

// Create the credentials object from environment variables
const googleCredentials = {
  type:process.env.GCLOUT_TYPE,
  project_id: process.env.GCLOUD_PROJECT_ID,
  private_key_id: process.env.GCLOUD_PRIVATE_KEY_ID,
  private_key: process.env.GCLOUD_PRIVATE_KEY,
  client_email: process.env.GCLOUD_CLIENT_EMAIL,
  client_id: process.env.GCLOUD_CLIENT_ID,
  auth_uri: process.env.GCLOUD_AUTH_URI,
  token_uri: process.env.GCLOUD_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GCLOUD_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GCLOUD_CLIENT_X509_CERT_URL,
  universe_domain:process.env.GCLOUD_UNIVERSE_DOMAIN
};
const storage = new Storage({projectId: 'gp-data-1-0', credentials: googleCredentials });

exports.SendGridEmailListener= onRequest((req,res)=>{
      const body = req.body
      
})

exports.runMigrations =onRequest((req, res) => {
  exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Migration failed: ${stderr}`);
    } else {
      res.status(200).send(`Migration successful: ${stdout}`);
    }
  });
});


exports.pdfEmail = onRequest(async (req,res)=>{
  console.log("pdfEmail",pdf_email)
  const {email}=req.body;
  const data = await pdf_email.create({
    emailAddress:email
  })
  res.status(200).send("created")
})
exports.LabReport= onRequest(async (req, res) => {
  try {
    const {protocolId,investigator,subjectId,dateOfCollection,timePoint,pdfEmailId }=req.body
    console.log("body",req.body)
  const data= await new lab_report({
    pdfEmailIdfk:pdfEmailId, protocolId,investigator,subjectId,dateOfCollection,timePoint
  }).save()
  console.log(data)
  return res.status(200).send("OK")
  } catch (error) {
    console.log(error)
    return res.status(500).send("Error: " + error)
  }
})

exports.LabReportData= onRequest(async (req, res) => {
  try {
    const labReoprtFk = 1; // This can be dynamic if needed
    const labDataArray = req.body; // Assuming req.body is an array of objects

    // Validate that req.body is an array
    if (!Array.isArray(labDataArray)) {
        return res.status(400).send("Error: Expected an array of lab report data objects");
    }

    // Create an array to hold the save operations
    const saveOperations = labDataArray.map(data => {
        const { key, value, refValue, isPending } = data;
        return new labreport_data({
            labReoprtFk: labReoprtFk,
            key: key,
            value: value,
            refValue: refValue,
            isPending: isPending
        }).save();
    });

    // Execute all save operations
    const savedData = await Promise.all(saveOperations);
    console.log(savedData);

    return res.status(200).send("OK");
} catch (error) {
    console.log(error);
    return res.status(500).send("Error: " + error.message);
}

})



exports.MakeCSV = onRequest(async (req, res) => {
  const { id, email, emailStatus } = req.body;

  try {
    // Fetch the data from the database
    const data = await labreport_data.findAll({
      where: {
        labReoprtFk: id,
      }
    });

    if (data.length === 0) {
      return res.status(404).send({ message: 'No data found' });
    }

    // Convert the data to JSON format
    const jsonData = data.map(record => record.toJSON());

    // Define fields for CSV, excluding labReoprtFk and protocolId
    const fields = ['id', 'key', 'value', 'refValue', 'isPending', 'createdAt', 'updatedAt'];
    const opts = { fields };

    // Convert JSON to CSV
    const parser = new Parser(opts);
    const csv = parser.parse(jsonData);

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");

    // Define the path to save the CSV file in Google Cloud Storage
    const bucketName = 'gpdata01'; // Replace with your bucket name
    const destination = `reports/report_${id}_${timestamp}.csv`;

    // Create a buffer from the CSV string
    const buffer = Buffer.from(csv, 'utf-8');

    // Upload the buffer to Google Cloud Storage
    const file = storage.bucket(bucketName).file(destination);
    await file.save(buffer, {
      contentType: 'text/csv',
    });

    // Save email record in the database
    await labreport_email.create({
      labReoprtFk: id,
      csvPath: destination,
      email: email,
      emailStatus: emailStatus
    });

    // Respond with the URL to the uploaded file
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

    return res.status(200).send({ message: 'CSV file created and uploaded', url: publicUrl });
  } catch (error) {
    console.error('Error creating or uploading CSV:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});
