const { exec } = require('child_process');
const {onRequest} = require("firebase-functions/v2/https");
const {pdf_email,labreport_data ,lab_report,labreport_email,ref_range_data} = require("./models/index");
const {UplaodFile,PdfEmail,labReport}= require("./helper/GpData")
const { Parser } = require('json2csv');


exports.SendGridEmailListener = onRequest(async (req, res) => {
  try {
    const { Name, Subject, From, Received, Attachment } = req.body;
    console.log(req.body);

    if (!Attachment) {
      return res.status(400).send("No attachment URL found in the request.");
    }

    // Call function to upload file and get necessary data
    const { pdfname, destination } = await UplaodFile(Attachment, From);
    const pdfURL = `${process.env.STORAGE_URL}${destination}`

    const{ pdfEmailId } = await PdfEmail(From,Received,pdfname,destination)

    // Example data for lab_report
    const data = {
      "protocolId": "MGL-3196-19",
      "investigator": "Dr. Anita Kohli",
      "subjectId": "0128-9013",
      "dateOfCollection": "20-Dec-202",
      "timePoint": "Week 40",
    };

    const {labReportId} = await labReport(data,pdfEmailId)
    
    // Return success response
    return res.status(200).send({
      message: "Records inserted successfully.",
      pdfEmailId: pdfEmailId,
      labReportId: labReportId,
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).send("Error processing request.");
  }
});

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

exports.LabReportData = onRequest(async (req, res) => {
  try {
    const labReoprtFk = 1; // This can be dynamic if needed
    const labDataArray = req.body; // Assuming req.body is an array of objects

    // Validate that req.body is an array
    if (!Array.isArray(labDataArray)) {
        return res.status(400).send("Error: Expected an array of lab report data objects");
    }

    // Create a map to store processed combinations for ref_range_data
    const refRangeDataMap = new Map();

    // First, handle the ref_range_data entries
    for (const data of labDataArray) {
        const { lab_provider, key, refValue } = data;

        // Create a unique key for the map
        const mapKey = `${lab_provider}_${key}`;

        // Check if the key and lab_provider exist in the map
        if (!refRangeDataMap.has(mapKey)) {
            let refRangeData = await ref_range_data.findOne({ 
                where: { 
                    key: key, 
                    labProvider: lab_provider 
                } 
            });

            // If it doesn't exist in the database, create it
            if (!refRangeData) {
                refRangeData = await ref_range_data.create({ key: key, labProvider: lab_provider, refValue: refValue });
            }

            // Store the primary key in the map
            refRangeDataMap.set(mapKey, refRangeData.id); // Ensure to use the correct attribute
        }
    }

    // Now, handle the labreport_data entries
    const saveOperations = labDataArray.map(async (data) => {
        const { lab_provider, key, value, isPending } = data;

        // Create a unique key for the map
        const mapKey = `${lab_provider}_${key}`;

        // Get the foreign key from the map
        const refRangeDataId = refRangeDataMap.get(mapKey);

        // Save the lab report data with the foreign key from ref_range_data
        return labreport_data.create({
            labReoprtFk: labReoprtFk,
            key: key,
            value: value,
            isPending: isPending,
            refRangeFk: refRangeDataId // Assuming id is the primary key of ref_range_data
        });
    });

    // Execute all save operations
    const savedData = await Promise.all(saveOperations);
    console.log(savedData);

    return res.status(200).send("OK");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error: " + error.message);
  }
});


exports.MakeCSV = onRequest(async (req, res) => {
  const { id, email, emailStatus } = req.body;

  try {
    // Fetch the data from the database including ref_range_data
    const data = await labreport_data.findAll({
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

    if (data.length === 0) {
      return res.status(404).send({ message: 'No data found' });
    }

    // Convert the data to JSON format
    const jsonData = data.map(record => {
      // Access ref_range_data attributes via the alias 'refRangeData'
      return {
        id: record.id,
        key: record.key,
        value: record.value,
        refValue: record.refRangeData ? record.refRangeData.refValue : '', // Access refValue from ref_range_data
        isPending: record.isPending,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      };
    });

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


