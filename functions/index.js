const { exec } = require('child_process');
const {onRequest} = require("firebase-functions/v2/https");
const {UplaodFile,PdfEmail,labReport,labReoprtData,MakeCsv}= require("./helper/GpData")


exports.SendGridEmailListener = onRequest(async (req, res) => {
  try {
    const { Name, Subject, From, Received, Attachment,To } = req.body;
    console.log(req.body);

    if (!Attachment) {
      return res.status(400).send("No attachment URL found in the request.");
    }

    // Call function to upload file and get necessary data
    const { pdfname, destination } = await UplaodFile(Attachment, From);
    const pdfURL = `${process.env.STORAGE_URL}${destination}`
    console.log("urlllllll", pdfURL)
    const{ pdfEmailId } = await PdfEmail(From,Received,pdfname,destination,To)

    // Example data for lab_report
    const data = {
      "protocolId": "MGL-3196-19",
      "investigator": "Dr. Anita Kohli",
      "subjectId": "0128-9013",
      "dateOfCollection": "20-Dec-202",
      "timePoint": "Week 40",
    };

    const {labReportId} = await labReport(data,pdfEmailId)
   
    const labdata= [
      {
      "lab_provider":"Medpace",
      "laboratory_name":"Hyaluronic",
      "value":"511.19",
      "refValue":"120"
  },{
      "lab_provider":"Medpace",
      "laboratory_name":" Acid",
      "value":"511.19",
      "refValue":"120"
  },{
      "lab_provider":"Medpace",
      "laboratory_name":"Hyaluronic Acid",
      "value":"511.19",
      "refValue":"120"
  },
  {
    "lab_provider":"Medpace",
    "laboratory_name":"Hyaluronic Acid",
    "value":"511.19",
    "refValue":"120"
}
  ]
    const labreportEntry = await labReoprtData(labdata,labReportId)
    const status = "sent"
    const csv = await MakeCsv(labReportId,From,status)
    console.log("================================",csv)
    return res.status(200).send({message:"Process completed"})
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




