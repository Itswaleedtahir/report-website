const { exec } = require('child_process');
const { onRequest } = require("firebase-functions/v2/https");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require("cors")({ origin: true });
const { Parser } = require('json2csv');
const sgMail = require('@sendgrid/mail');
const { Op, Sequelize } = require("sequelize");
const { UplaodFileTemp, PdfEmail, labReport, labReoprtData, MakeCsv, pdfProcessor, findAllLabData, insertOrUpdateLabReport, logoExtraction, UploadFile, coordinateExtraction } = require("./helper/GpData");
const { users, admin, pdf_email, labreport_data, lab_report, labreport_csv, ref_range_data, signedPdfs, printedPdfs } = require("./models/index");
const fs = require('fs');
const sequelize = require('./config/db'); // Import the configured instance
const { PDFDocument } = require('pdf-lib');
const signwell = require('@api/signwell');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const path = require('path');
const os = require('os');
// const Queue = require('bull');
sgMail.setApiKey('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');

const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

const redisConfig = {
  host: 'redis-18209.c326.us-east-1-3.ec2.redns.redis-cloud.com',
  port: 18209,
  password: 'ZHgNfkQhZSFExZwCp52swgzqe6kQ6cKy',
  maxRetriesPerRequest: null // Disable automatic retries
};

// Create a Redis client
const redisClient = new IORedis(redisConfig);
async function addJobToRedis(data) {
  await redisClient.rpush('pdfJobQueue', JSON.stringify(data));
  console.log('Job added to Redis:', data);
}


//Testing function for debugging
exports.findAndUpdate = onRequest(async (req, res) => {
  const { protocolId, subjectId, time_of_collection, dateOfCollection, timePoint, lab_name, email_to } = req.body
  // const data = await findAllLabData(protocolId,subjectId,dateOfCollection,timePoint,time_of_collection,lab_name,email_to)
  // console.log("data",data)
  const datatest = [
    {
      "type": "Time_of_Collecton",
      "mentionText": "07:38"
    },
    {
      "type": "Tests",
      "properties": [
        {
          "type": "Ref_Range",
          "mentionText": "63.0-552.0"
        },
        {
          "type": "Result",
          "mentionText": "Pending"
        },
        {
          "type": "Test",
          "mentionText": "Tissue Inhibitor of\nMetalloproteinase 1"
        }
      ]
    },
    {
      "type": "Tests",
      "properties": [
        {
          "type": "Ref_Range",
          "mentionText": "<120"
        },
        {
          "type": "Result",
          "mentionText": "511.19"
        },
        {
          "type": "Test",
          "mentionText": "Hyaluronic Acid"
        }
      ]
    },
    {
      "type": "Tests",
      "properties": [
        {
          "type": "Ref_Range",
          "mentionText": "3.50 -9.50"
        },
        {
          "type": "Result",
          "mentionText": "14.19"
        },
        {
          "type": "Test",
          "mentionText": "Amino-terminal propeptide of type III procollagen"
        }
      ]
    },
    {
      "type": "Tests",
      "properties": [
        {
          "type": "Ref_Range",
          "mentionText": "N/A - See"
        },
        {
          "type": "Result",
          "mentionText": "11.88"
        },
        {
          "type": "Test",
          "mentionText": "Enhanced Liver Fibrosis Test (ELF)"
        }
      ]
    },
    {
      "type": "protocolId",
      "mentionText": "MGL-3196-19"
    },
    {
      "type": "dateOfCollection",
      "mentionText": "20-Dec-2023"
    },
    {
      "type": "investigator",
      "mentionText": "Dr. Anita Kohli"
    },
    {
      "type": "timePoint",
      "mentionText": "Week 40"
    },
    {
      "type": "subjectId",
      "mentionText": "0128-9013"
    },
    {
      "type": "Tests",
      "properties": [
        {
          "type": "Result",
          "mentionText": "Pending"
        },
        {
          "type": "Test",
          "mentionText": "Phosphatidylethanol, Blood"
        }
      ]
    }
  ]
  const extractData = (data) => {
    if (!Array.isArray(data)) {
      console.error('Invalid input: data is not an array');
      return;  // or throw an error, or handle this case as needed
    }

    const tests = data.filter(item => item.type === "Tests").map(test => {
      // Assuming that the properties are nested arrays, flatten them first
      const properties = test.properties.flat(); // Flatten the nested arrays

      const labTest = properties.find(prop => prop.type === "Test");
      const result = properties.find(prop => prop.type === "Result");
      const refRange = properties.find(prop => prop.type === "Ref_Range");

      return {
        lab_provider: "Medpace",
        lab_name: labTest ? labTest.mentionText : 'Unknown',
        value: result ? result.mentionText : 'Pending',
        refValue: refRange ? refRange.mentionText : 'N/A' // Handle missing reference range gracefully
      };
    });

    return {
      protocolId: data.find(item => item.type === "protocolId")?.mentionText || 'Unknown',
      investigator: data.find(item => item.type === "investigator")?.mentionText || 'Unknown',
      subjectId: data.find(item => item.type === "subjectId")?.mentionText || 'Unknown',
      dateOfCollection: data.find(item => item.type === "dateOfCollection")?.mentionText || 'Unknown',
      timePoint: data.find(item => item.type === "timePoint")?.mentionText || 'Unknown',
      timeOfCollection: data.find(item => item.type === "Time_of_Collecton")?.mentionText || 'Unknown',
      tests: tests
    };
  };

  const extractedData = extractData(datatest);
  const id = 100
  const { message } = await insertOrUpdateLabReport(extractedData, email_to)
  return res.status(200).send(message)
})

exports.test = onRequest(async (req, res) => {
  const emailContent = req.body.toString('utf8');

  function extractPDFs(base64Content) {
    const boundaryRegex = /filename="([^"]+.pdf)";[\s\S]+?base64\s([\s\S]*?)\n--/g;
    let match;
    let pdfs = [];
    while ((match = boundaryRegex.exec(base64Content)) !== null) {
      pdfs.push({
        filename: match[1],
        data: match[2].replace(/[\r\n]+/g, '')  // Remove newlines in base64 encoding
      });
    }
    return pdfs;
  }

  // Extract PDF base64 strings
  const pdfs = extractPDFs(emailContent);
  // console.log("pdfs", pdfs)
  // Path to the uploads directory
  const uploadsDir = path.join(__dirname, 'uploads');

  // Ensure the uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Save each PDF
  pdfs.forEach((pdf, index) => {
    const filePath = path.join(uploadsDir, `${Date.now()}_${pdf.filename}`);
    const binaryData = Buffer.from(pdf.data, 'base64');

    fs.writeFile(filePath, binaryData, (err) => {
      if (err) {
        console.error(`Error writing PDF to file: ${pdf.filename}`, err);
      } else {
        console.log(`PDF saved: ${filePath}`);
      }
    });
  });
});

function extractPDFs(base64Content) {
  const boundaryRegex = /filename="([^"]+.pdf)";[\s\S]+?base64\s([\s\S]*?)\n--/g;
  let match;
  let pdfs = [];
  while ((match = boundaryRegex.exec(base64Content)) !== null) {
    pdfs.push({
      filename: match[1],
      base64Content: match[2].replace(/[\r\n]+/g, '')  // Remove newlines in base64 encoding
    });
  }
  return pdfs;
}
function extractPDFAttachments(email) {
  const boundaryMatch = email.match(/boundary="?([^"\s;]+)"?/);
  if (!boundaryMatch) {
    return []; // No boundary found
  }
  const boundary = boundaryMatch[1];

  // Adjusted regex to skip over additional headers before Base64 content
  const boundaryRegex = new RegExp(`--${boundary}(?:\\r\\n|\\r|\\n).*?Content-Type: application/pdf;[^]+?filename="([^"]+)"[^]+?X-Attachment-Id: [^\\r\\n]+(?:\\r\\n|\\r|\\n){2}([\\s\\S]*?)(?=--${boundary}|--$)`, 'gi');

  const attachments = [];
  let match;
  console.log("whileloopstartrteddd")
  while ((match = boundaryRegex.exec(email)) !== null) {
    const [, filename, base64Content] = match;
    // Trimming and removing any extra headers before the Base64 content starts
    const cleanBase64 = base64Content.replace(/^[\\r\\n]+/, '').trim();
    attachments.push({
      filename,
      base64Content: cleanBase64
    });
  }
  console.log("whileloopended")

  return attachments;
}

// Cloud Function for processing email data
exports.SendGridEmailListenerForEmailData = onRequest({
  timeoutSeconds: 3600,
  memory: "1GiB",
}, async (req, res) => {
  let responseSent = false; // Flag to track if the response is sent

  cors(req, res, async () => {
    try {

      res.status(200).send("pdf done"); // Initial response
      const bufferDataString = req.body.toString('utf8');
      let parts = bufferDataString.split("--xYzZY");
      // Regular expression to find an email within the content
      // Regular expression to find the 'to' email in the 'Content-Disposition' section of a forwarded message



      let toAddress = "", fromAddress = "", DateReceivedEmail = "";

      // Regex patterns and extraction logic
      const toPattern = /To: (.*)\r\n/;
      const fromPattern = /From: (.*)\r\n/;
      const DatePattern = /Date: (.*)\r\n/;

      // Extracting addresses
      const toMatch = parts.find(part => toPattern.test(part));
      // console.log("tomatch",toMatch)
      if (toMatch) toAddress = toMatch.match(toPattern)[1].trim();
      const fromMatch = parts.find(part => fromPattern.test(part));
      // console.log("fromMatch",fromMatch)
      if (fromMatch) fromAddress = fromMatch.match(fromPattern)[1].trim();
      const DateReceived = parts.find(part => DatePattern.test(part));
      if (DateReceived) DateReceivedEmail = DateReceived.match(DatePattern)[1].trim();
      let attachments;
      if (fromAddress.includes("@outlook.com")) {
        const emailRegex = /<([^>]+)>|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/; // Regex to extract email within angle brackets or plain email
        console.log("to", toAddress);
        const match = toAddress.match(emailRegex);
        toAddress = match ? (match[1] || match[2]) : null; // Extract the email if a match is found

        if (toAddress) {
          console.log("Valid email:", toAddress);
        } else {
          console.log("Invalid email format.");
        }
        // Extract and handle attachments
        attachments = extractPDFs(bufferDataString);
      } else {
        attachments = extractPDFAttachments(bufferDataString);
      }
      function extractForwardedEmail(content) {
        const regex = /Content-Disposition: form-data; name="to"\s+([^\s]+)/;
        const match = content.match(regex);
        return match ? match[1] : null;
      }
      if (bufferDataString.includes("Forwarded message")) {

        toAddress = extractForwardedEmail(bufferDataString);

        console.log('Forwarded to:', toAddress);
      }
      // console.log("attachments count", attachments.length);

      for (const attachment of attachments) {
        // Define the uploads directory using the specified path
        const uploadsDir = path.join(__dirname, 'uploads');

        // Base64 decoding and file writing process
        const pdfBuffer = Buffer.from(attachment.base64Content, 'base64');
        const timestamp = new Date().getTime();
        const filename = `output-${timestamp}.pdf`;
        const pdfPath = path.join(uploadsDir, filename);
        // Define the path to save the PDF

        try {
          // Ensure the directory exists
          fs.mkdirSync(uploadsDir, { recursive: true });
          console.log('Directory created:', uploadsDir);

          // Write the PDF file
          fs.writeFileSync(pdfPath, pdfBuffer);
          console.log('File written:', pdfPath);
          const { pdfname, destination } = await UplaodFileTemp(pdfPath);
          const path = `https://storage.googleapis.com/gpdata01/${destination}`
          // Prepare job data
          const jobData = {
            pdfPath: path,
            toAddress: toAddress,
            fromAddress: fromAddress,
            DateReceivedEmail: DateReceivedEmail
          };

          // Add job to Redis queue
          await addJobToRedis(jobData);
          console.log(`Added job for PDF: ${pdfPath}`);

        } catch (err) {
          console.error('Error handling file:', err);
          continue; // Skip to the next iteration if an error occurs
        }
      }

      console.log("PDFs are queued for processing");
    } catch (error) {
      console.error("Error processing request:", error);
      if (!responseSent) {
        responseSent = true; // Ensure we send a response
        return res.status(500).send("Error processing request.");
      }
    }
  });
});

// This function sets up an HTTP endpoint to trigger database migrations using Sequelize CLI.
exports.runMigrations = onRequest((req, res) => {
  // Execute the Sequelize CLI command to run migrations
  exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
    if (error) {
      // If an error occurs during the migration, send a 500 status code and error message
      res.status(500).send(`Migration failed: ${stderr}`);
    } else {
      // If the migration is successful, send a 200 status code and success message
      res.status(200).send(`Migration successful: ${stdout}`);
    }
  });
});

// This function defines an HTTP endpoint to search for lab reports based on specific criteria.
exports.searchLabReports = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS for handling cross-origin requests
    try {
      // Retrieve the search term from the request body
      const { searchTerm } = req.body;

      // Validate that the searchTerm is provided
      if (!searchTerm) {
        return res.status(400).send("searchTerm is not defined");
      }

      // Build the search criteria using Sequelize's Op.like to find records with matching fields
      const searchCriteria = {
        [Op.or]: [
          { investigator: { [Op.like]: `%${searchTerm}%` } }, // Search in the 'investigator' field
          { protocolId: { [Op.like]: `%${searchTerm}%` } }, // Search in the 'protocolId' field
          { subjectId: { [Op.like]: `%${searchTerm}%` } } // Search in the 'subjectId' field
        ]
      };

      // Perform a database query to find all lab reports that meet the search criteria
      const labReports = await lab_report.findAll({ where: searchCriteria });

      // Handle the case where no lab reports are found
      if (labReports.length === 0) {
        return res.status(404).send("No lab reports found.");
      }

      // Enhance each lab report with its corresponding CSV content, if available
      const labReportsWithCsv = await Promise.all(labReports.map(async (labReport) => {
        const labReportCsv = await labreport_csv.findOne({ where: { labReoprtFk: labReport.id } });
        console.log("csv", labReportCsv); // Log CSV data for debugging
        return {
          labReport,
          csvContent: labReportCsv ? labReportCsv : null // Attach the CSV content if found
        };
      }));

      // Respond with the enhanced lab reports containing both report data and CSV content
      return res.status(200).json(labReportsWithCsv);
    } catch (error) {
      // Log and handle any errors that occur during the request processing
      console.error("Error processing request:", error);
      return res.status(500).send("Error processing request.");
    }
  })
});

// This function sets up an HTTP endpoint to search for lab reports based on various filters and supports pagination.
exports.searchLabReportsByFilters = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);

    if (!authHeader) {
      return res.sendStatus(401);
    }

    try {
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(new Error('Forbidden'));
          } else {
            resolve(user);
          }
        });
      });

      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      const usersFound = await users.findAll({ where: { user_email: email_to } });
      const nonArchivedEmails = usersFound.filter(user => !user.isArchived).map(user => user.user_email);

      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All provided users are archived' });
      }

      const { protocolId, subjectId, lab_name, timePoint } = req.body;
      let labNameArray = lab_name ? JSON.parse(lab_name) : [];
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const whereConditions = { email_to: { [Op.in]: nonArchivedEmails } };
      if (protocolId) whereConditions.protocolId = protocolId;
      if (subjectId) whereConditions.subjectId = subjectId;
      if (timePoint) whereConditions.timePoint = timePoint;

      let labReports = [];

      if (labNameArray.length > 0) {
        labReports = await Promise.all(labNameArray.map(async (name) => {
          return await lab_report.findAll({
            where: whereConditions,
            include: [{
              model: labreport_data,
              as: 'labreport_data',
              where: { lab_name: name },
              required: true,
              include: [{
                model: ref_range_data,
                as: 'refRangeData',
                attributes: ['refValue'],
                required: false
              }]
            }]
          });
        }));
        labReports = labReports.flat();
      } else {
        labReports = await lab_report.findAll({
          where: whereConditions,
          include: [{
            model: labreport_data,
            as: 'labreport_data',
            required: false,
            include: [{
              model: ref_range_data,
              as: 'refRangeData',
              attributes: ['refValue'],
              required: false
            }]
          }]
        });
      }

      const pdfResultsforId = await Promise.all(labReports.map(async (report) => {
        return pdf_email.findAll({ where: { id: report.pdfEmailIdfk } });
      }));
      const pdfPathMapId = pdfResultsforId.flat().reduce((acc, pdf) => ({
        ...acc,
        [pdf.id]: pdf.dataValues.pdfPath
      }), {});

      console.log("pdfPathMapId", pdfPathMapId)

      const pdfResults = await Promise.all(labReports.map(async (report) => {
        return Promise.all(report.labreport_data.map(async data => { // Ensure all inner promises are resolved
          return pdf_email.findAll({ where: { id: data.pdfEmailIdFk } });
        }));
      }));

      const flatPdfResults = pdfResults.flat(2); // You might need more or less flattening based on actual data structure



      const pdfPathMap = flatPdfResults.reduce((acc, pdf) => {
        if (Array.isArray(pdf)) { // Check if it's an array and handle accordingly
          pdf.forEach(innerPdf => {
            acc[innerPdf.id] = innerPdf.dataValues.pdfPath;
          });
        } else {
          acc[pdf.id] = pdf.dataValues.pdfPath; // Handle non-array case
        }
        return acc;
      }, {});

      function transformData(reports, pdfPathMap, pdfPathMapId) {
        console.log("pdf", pdfPathMap)
        const uniqueReportsMap = new Map();

        reports.forEach(report => {
          if (report.labreport_data && report.labreport_data.length > 0) {
            report.labreport_data.forEach(data => {
              const uniqueKey = `${report.protocolId}-${report.investigator}-${report.subjectId}-${report.dateOfCollection}-${report.timePoint}-${report.email_to}-${report.time_of_collection}-${data.lab_name}`;

              let existingEntry = uniqueReportsMap.get(uniqueKey);
              if (!existingEntry || existingEntry.value === "Pending" && data.value !== "Pending") {
                // Attempt to get the pdfPath from pdfPathMap using data.pdfEmailIdFk
                let pdfPath = pdfPathMap[data.pdfEmailIdFk];

                // If pdfPath is undefined, check pdfPathMapId
                if (!pdfPath) {
                  pdfPath = pdfPathMapId[report.dataValues.pdfEmailIdfk];
                }

                // Log the pdfPath for debugging
                console.log("pdfPath", pdfPath);

                const combinedData = {
                  ...report.dataValues,
                  ...data.dataValues,
                  pdfpath: pdfPath || 'default/path/if/none/found', // Set a default path or handle as needed
                  labreport_data: undefined
                };
                uniqueReportsMap.set(uniqueKey, combinedData);
              }
            });
          }
        });

        return Array.from(uniqueReportsMap.values());
      }


      labReports.sort((a, b) => {
        return new Date(b.dataValues.dateOfCollection) - new Date(a.dataValues.dateOfCollection);
      });

      const transformedReports = transformData(labReports, pdfPathMap, pdfPathMapId);
      const startIndex = (page - 1) * pageSize;
      const paginatedLabReports = transformedReports.slice(startIndex, startIndex + pageSize);

      return res.json({
        data: paginatedLabReports,
        pagination: {
          totalItems: transformedReports.length,
          totalPages: Math.ceil(transformedReports.length / pageSize),
          currentPage: page,
          pageSize
        }
      });
    } catch (error) {
      console.error('Error in processing:', error);
      if (error.message === 'Forbidden') {
        return res.sendStatus(403);
      }
      return res.status(500).send("Internal server error");
    }
  });
});


// This function sets up an HTTP endpoint to fetch and process plot values based on specified filters.
exports.getPlotValuesByFilters = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);

    if (!authHeader) {
      return res.sendStatus(401);
    }

    try {
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(new Error('Forbidden'));
          } else {
            resolve(user);
          }
        });
      });

      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      // Find the users based on email_to and filter out archived users
      const usersFound = await users.findAll({
        where: { user_email: email_to }
      });

      const nonArchivedEmails = usersFound.filter(user => !user.isArchived).map(user => user.user_email);

      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All provided users are archived' });
      }

      const { protocolId, subjectId, lab_name } = req.body;
      let labNameArray = lab_name ? JSON.parse(lab_name) : [];

      let labReports = await Promise.all(labNameArray.map(async (name) => {
        return await lab_report.findAll({
          where: { protocolId: protocolId, subjectId: subjectId, email_to: { [Sequelize.Op.in]: nonArchivedEmails } },
          include: [{
            model: labreport_data,
            as: 'labreport_data',
            where: { lab_name: name },
            required: true,
          }]
        });
      }));
      labReports = labReports.flat();
      function transformData(reports) {
        const uniqueReportsMap = new Map();

        reports.forEach(report => {
          if (report.labreport_data && report.labreport_data.length > 0) {
            report.labreport_data.forEach(data => {
              const uniqueKey = `${report.protocolId}-${report.investigator}-${report.subjectId}-${report.dateOfCollection}-${report.timePoint}-${report.email_to}-${report.time_of_collection}-${data.lab_name}`;

              let existingEntry = uniqueReportsMap.get(uniqueKey);
              if (!existingEntry || existingEntry.value === "Pending" && data.value !== "Pending") {
                const combinedData = {
                  lab_name: data.lab_name,
                  time_of_collection: report.time_of_collection,
                  value: data.value,
                  dateOfCollection: report.dateOfCollection,
                  email_to: report.email_to
                };
                uniqueReportsMap.set(uniqueKey, combinedData);
              }
            });
          }
        });

        return Array.from(uniqueReportsMap.values());
      }

      let transformedReports = transformData(labReports);
      function parseDateString(dateStr) {
        const [day, month, year] = dateStr.split("-");
        const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
        return new Date(year, monthIndex, parseInt(day));
      }

      // transformedReports.sort((a, b) => parseDateString(a.dateOfCollection) - parseDateString(b.dateOfCollection));

      return res.status(201).send(transformedReports);
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  });
});

// This function sets up an HTTP endpoint to retrieve lab data filtered by specified parameters such as lab name and time point.
exports.getLabDataOnTimePoint = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader); // Log the received authorization header for debugging

    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization header is present
    }

    try {
      // Decode and verify the JWT from the authorization header
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(new Error('Forbidden')); // Reject if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if token is valid
          }
        });
      });

      // Determine the appropriate email to filter lab reports based on user role
      let email_to = userDecode.user.isEmployee ? userDecode.user.invitedBy : userDecode.user.user_email;
      const user = await users.findOne({ where: { user_email: email_to } });
      console.log("user", user)
      if (user.dataValues.isArchived == true) {
        // If no user is found with the provided email, return a 404 Not Found status.
        return res.status(400).send({ message: 'User is archived' });
      }
      // Extract the relevant filter criteria from the request body
      const { protocolId, subjectId, lab_name, timePoint } = req.body;
      let labNameArray = lab_name ? JSON.parse(lab_name) : []; // Parse lab names if provided

      // Set up pagination parameters
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      // Construct where conditions for the lab_report query
      const whereConditions = { email_to, timePoint };
      if (protocolId) whereConditions.protocolId = protocolId;
      if (subjectId) whereConditions.subjectId = subjectId;

      let labReports = [];

      // Fetch lab reports filtered by lab names if provided
      if (labNameArray.length > 0) {
        labReports = await Promise.all(labNameArray.map(async (name) => {
          return await lab_report.findAll({
            where: whereConditions,
            order: [['createdAt', 'DESC']],
            include: [{
              model: labreport_data,
              as: 'labreport_data',
              where: { lab_name: name },
              required: true,
              include: [{
                model: ref_range_data,
                as: 'refRangeData',
                attributes: ['refValue'],
                required: false
              }]
            }]
          });
        }));
        labReports = labReports.flat(); // Flatten the array of lab reports for processing
      } else {
        // Fetch all lab reports that match the where conditions without filtering by lab names
        labReports = await lab_report.findAll({
          where: whereConditions,
          order: [['createdAt', 'DESC']],
          include: [{
            model: labreport_data,
            as: 'labreport_data',
            required: true,
            include: [{
              model: ref_range_data,
              as: 'refRangeData',
              attributes: ['refValue'],
              required: false
            }]
          }]
        });
      }

      // Transform the lab reports into a flat list of report data for easier consumption
      function transformData(reports) {
        let transformed = [];
        reports.forEach(report => {
          if (report.labreport_data && report.labreport_data.length > 0) {
            report.labreport_data.forEach(data => {
              const combinedData = {
                ...report.dataValues, // Combine the main report properties
                ...data.dataValues, // Combine the detailed lab data properties
                labreport_data: undefined // Remove the nested labreport_data array
              };
              transformed.push(combinedData);
            });
          } else {
            // Handle cases where labreport_data is missing or undefined
            const reportData = { ...report.dataValues };
            transformed.push(reportData);
          }
        });
        return transformed;
      }

      const transformedReports = transformData(labReports); // Transform the reports for output

      // Apply pagination to the transformed list of lab reports
      const startIndex = (page - 1) * pageSize;
      const paginatedLabReports = transformedReports.slice(startIndex, startIndex + pageSize);

      // Return the paginated lab reports along with pagination details
      return res.json({
        data: paginatedLabReports,
        pagination: {
          totalItems: transformedReports.length,
          totalPages: Math.ceil(transformedReports.length / pageSize),
          currentPage: page,
          pageSize
        }
      });
    } catch (error) {
      console.log(error); // Log any errors that occur during processing
      return res.status(500).send(error); // Return Internal Server Error if an exception is caught
    }
  });
});

// This function sets up an HTTP endpoint to retrieve all CSV records associated with lab reports.
exports.getAllLabReportCsv = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests
    try {
      // Perform a database query to fetch all records from the labreport_csv table
      const labReportCsvs = await labreport_csv.findAll();

      // Return the fetched data as a JSON response with a 200 OK status
      return res.status(200).json(labReportCsvs);
    } catch (error) {
      // Log any errors that occur during the database query
      console.error("Error fetching lab report CSV data:", error);

      // Send a 500 Internal Server Error status with an error message
      return res.status(500).send("Error fetching lab report CSV data.");
    }
  })
});

// This function sets up an HTTP endpoint to retrieve names of lab reports associated with a user's email.
exports.getLabReportNamesByEmail = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);  // Log the received authorization header for debugging
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization header is present
    }

    try {
      // Decode and verify the JWT from the authorization header asynchronously
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject('Forbidden'); // Reject the promise if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if the token is valid
          }
        });
      });

      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      // Find the users based on email_to and filter out archived users
      const usersFound = await users.findAll({
        where: { user_email: email_to }
      });

      // Filter out archived users
      const nonArchivedEmails = usersFound
        .filter(user => !user.isArchived)
        .map(user => user.user_email);

      // If all users are archived, return a message indicating so
      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All users are archived' });
      }

      const { protocolId, subjectId } = req.body; // Extract the protocolId and subjectId from the request body

      // Perform a database query to fetch lab reports matching the specified criteria
      const labReports = await lab_report.findAll({
        where: { email_to: { [Sequelize.Op.in]: nonArchivedEmails }, subjectId: subjectId, protocolId: protocolId },
        attributes: ['id'] // Only fetch the 'id' attribute for minimal data retrieval
      });

      if (labReports.length === 0) {
        return res.status(404).send("No lab reports found for the given emails."); // Handle case with no matches
      }

      // Extract IDs from the lab reports to fetch corresponding lab data
      const labReportIds = labReports.map(report => report.id);

      // Fetch unique lab names from labreport_data using the extracted IDs
      const labReportData = await labreport_data.findAll({
        where: { labReoprtFk: labReportIds },
        attributes: ['lab_name'],
        group: ['lab_name'] // Group by 'lab_name' to ensure uniqueness
      });

      // Extract lab names from the results and prepare the response
      const labNames = labReportData.map(data => data.lab_name);
      return res.json({ labNames }); // Send the list of unique lab names as a response
    } catch (error) {
      if (error === 'Forbidden') {
        return res.sendStatus(403); // Forbidden status if JWT verification fails
      }
      console.error('Error:', error); // Log any errors for debugging
      return res.status(500).send("Internal server error"); // Return Internal Server Error for other cases
    }
  });
});

// This function sets up an HTTP endpoint to add a new admin user to the database.
exports.addAdmin = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests
    const { user_email, password } = req.body; // Extract email and password from the request body

    try {
      // Check if an admin user with the provided email already exists in the database
      const existingUser = await admin.findOne({ where: { user_email } });
      if (existingUser) {
        // If user already exists, return a 400 Bad Request with a message
        return res.status(400).json({ message: "User already exists" });
      }

      // If user does not exist, hash the password using bcrypt with a salt round of 10
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new admin user with the hashed password
      const newUser = await admin.create({ user_email, password: hashedPassword });

      // If the new admin user is successfully created, return a 201 Created status
      res.status(201).json({ message: "Admin user created successfully", user: newUser });
    } catch (error) {
      // Log the error if there is an issue during the admin creation process
      console.error("Error during admin creation:", error);
      // Return a 500 Internal Server Error status if an exception is caught
      res.status(500).json({ message: "Internal server error" });
    }
  })
});

// This function sets up an HTTP endpoint for admin login, which includes authentication and token generation.
exports.adminLogin = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests
    const { user_email, password } = req.body; // Extract email and password from the request body

    try {
      // Find the admin user in the database using the provided email
      const user = await admin.findOne({ where: { user_email } });
      if (!user) {
        // If no user is found with the given email, return a 401 Unauthorized status with a message
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare the provided password with the hashed password stored in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // If the password comparison fails, return a 401 Unauthorized status with a message
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate a JSON Web Token (JWT) for the authenticated user with a 1-day expiration
      const token = jwt.sign({ id: user.id, email: user.user_email }, "your_secret_key", { expiresIn: "1d" });

      // Return the token and a success message in the response if login is successful
      res.json({ message: "Login successful", token });
    } catch (error) {
      // Log any errors that occur during the login process
      console.error("Error during login:", error);
      // Return a 500 Internal Server Error status with an error message if an exception is caught
      res.status(500).json({ message: "Internal server error" });
    }
  })
});

// This function sets up an HTTP endpoint to send an invitation email to a potential client.
exports.clientInvite = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests
    try {
      let { clientEmail } = req.body; // Extract client email from the request body
      if (!clientEmail) {
        // If client email is not provided, return a 400 Bad Request status
        return res.status(400).send('Client email is required.');
      }
      const existingAdmin = await admin.findOne({ where: { user_email: clientEmail } });
      if (existingAdmin) {
        // If an invitation already exists, return a 400 Bad Request status with a message
        return res.status(400).json({ message: "This is an Admin Account" });
      }
      // Remove the 'client.' subdomain from the email if it exists
      //  const inviteClientEmail = clientEmail.replace('client.', '');
      //   console.log("new email",inviteClientEmail)
      // Check if an invitation has already been sent to this email
      const existingUser = await users.findOne({ where: { user_email: clientEmail } });
      if (existingUser) {
        // If an invitation already exists, return a 400 Bad Request status with a message
        return res.status(400).json({ message: "Invitation link already sent" });
      }

      // Generate a unique token using UUID
      const token = uuidv4();
      // // Construct the invitation URL using the generated token
      // const invitationUrl = `http://gpdataservices.com/invite/${token}`;

      // Store the new user with the token in the database for later verification
      await users.create({ user_email: clientEmail, token });

      // Email message setup
      // const msg = {
      //   to: clientEmail, // Recipient's email after modification
      //   from: 'support@gpdataservices.com', // Your verified sender email
      //   subject: 'Welcome to GP Data Services!',
      //   text: `Welcome to GP Data Services! We’re thrilled to have you join our community. Click the following link to set your password: ${invitationUrl}`,
      //   html: `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
      //           <h2>Welcome to GP Data Services!</h2>
      //           <p>We’re thrilled to have you join our community and can’t wait to collaborate with you. Our platform is built to supercharge your data management, providing you with powerful tools to organize, trend, and recruit based off of your lab data—all designed to elevate your research efforts.</p>
      //           <p>Together, we’ll make your data work harder and smarter for you.</p>
      //           <p>Know more, Achieve more, Excel more</p>
      //           <p>Click the link below to set up your password and dive in. We’re here to back you up every step of the way!</p>
      //           <p><a href="${invitationUrl}" style="color: #1a73e8; text-decoration: none;">Set Your Password</a></p>
      //           <img src="https://storage.googleapis.com/gpdata01/image/image-3.png" style="padding-top: 20px;" width="300px"/>
      //         </div>`,
      // };

      // // Send the email using sgMail
      // await sgMail.send(msg);
      // console.log('Invitation email sent successfully', msg); // Log the success message and the email details
      return res.status(200).send('Client Created Successfully'); // Send a 200 OK status with a success message
    } catch (error) {
      // Log any errors that occur during the invitation process
      console.error('Error sending invitation email:', error.response ? error.response.body : error.message);
      // Return a 400 Bad Request status with the error message
      return res.status(400).send({ error: error.message });
    }
  })
});

// This function sets up an HTTP endpoint to send an invitation email to a potential employee.
exports.employeeInvite = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { clientEmail, email_to } = req.body; // Extract client email and inviter email from the request body

      if (!clientEmail) {
        // If client email is not provided, return a 400 Bad Request status
        return res.status(400).send('user email is required.');
      }

      // Check if the inviter (email_to) has already invited this clientEmail
      const existingInvitation = await users.findOne({
        where: {
          user_email: clientEmail,
          invitedBy: email_to
        }
      });
      if (existingInvitation) {
        if (existingInvitation.token === null) {
          // If an invitation already exists by this inviter, return a 400 Bad Request status with a message
          return res.status(400).json({ message: `You have already invited ${clientEmail}` });
        }
      }
      const expirationPeriod = 3 * 60 * 1000; // 3 minutes in milliseconds
      const expirationDate = new Date(Date.now() + expirationPeriod);

      // Check if the user was invited by someone else
      const existingUser = await users.findOne({
        where: {
          user_email: clientEmail
        }
      });

      if (existingUser) {
        // If invitedBy is null, it means the user was created by an admin and no invitation should be sent
        if (existingUser.invitedBy === null) {
          return res.status(400).json({ message: `User with email ${clientEmail} was set by an admin. Invitations cannot be sent.` });
        }
        // If the token is empty, the user has already set their password
        if (!existingUser.token) {
          // Create a new user entry for this inviter (email_to), keeping the clientEmail
          await users.create({
            user_email: clientEmail,
            invitedBy: email_to,
            isEmployee: true
          });

          return res.status(200).json({ message: `User with email ${clientEmail} has already set their password, but they are now associated with the inviter ${email_to}.` });
        }
        if (new Date() < existingUser.expirationDate) {
          // Handle expired invitation
          return res.status(400).json({ message: `The invitation for ${clientEmail} has not expired yet.` });
        }

        // If the token is not empty, update it with a new token and resend the invitation email
        const newToken = uuidv4();
        existingUser.token = newToken;
        existingUser.expirationDate = expirationDate
        await existingUser.save(); // Update the token in the database

        // Send the updated email with the new token
        const invitationUrl = `http://gpdataservices.com/invite/${newToken}`;
        const msg = {
          to: clientEmail, // Recipient's email
          from: 'support@gpdataservices.com', // Your verified sender email
          subject: 'Invitation to Set Your Password',
          text: `Please click the following link to set your password: ${invitationUrl}`, // Text version of the email
          html: `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
            <h2>Welcome to GP Data Services!</h2>
            <p>We’re thrilled to have you join our community and can’t wait to collaborate with you. Our platform is built to supercharge your data management, providing you with powerful tools to organize, trend, and recruit based off of your lab data—all designed to elevate your research efforts.</p>
            <p>Together, we’ll make your data work harder and smarter for you.</p>
            <p>Know more, Achieve more, Excel more</p>
            <p>Click the link below to set up your password and dive in. We’re here to back you up every step of the way!</p>
            <p><a href="${invitationUrl}" style="color: #1a73e8; text-decoration: none;">Set Your Password</a></p>
            <img src="https://storage.googleapis.com/gpdata01/image/image-3.png" style="padding-top: 20px;" width="300px"/>
          </div>`,
        };

        await sgMail.send(msg);
        console.log('Updated invitation email sent successfully', msg);
        return res.status(200).send('Updated invitation email sent successfully');
      } else {
        const newToken = uuidv4();
        await users.create({
          user_email: clientEmail,
          invitedBy: email_to,
          token: newToken,
          expirationDate: expirationDate,
          isEmployee: true
        });
        // Send the updated email with the new token
        const invitationUrl = `http://gpdataservices.com/invite/${newToken}`;
        const msg = {
          to: clientEmail, // Recipient's email
          from: 'support@gpdataservices.com', // Your verified sender email
          subject: 'Invitation to Set Your Password',
          text: `Please click the following link to set your password: ${invitationUrl}`, // Text version of the email
          html: `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
              <h2>Welcome to GP Data Services!</h2>
              <p>We’re thrilled to have you join our community and can’t wait to collaborate with you. Our platform is built to supercharge your data management, providing you with powerful tools to organize, trend, and recruit based off of your lab data—all designed to elevate your research efforts.</p>
              <p>Together, we’ll make your data work harder and smarter for you.</p>
              <p>Know more, Achieve more, Excel more</p>
              <p>Click the link below to set up your password and dive in. We’re here to back you up every step of the way!</p>
              <p><a href="${invitationUrl}" style="color: #1a73e8; text-decoration: none;">Set Your Password</a></p>
              <img src="https://storage.googleapis.com/gpdata01/image/image-3.png" style="padding-top: 20px;" width="300px"/>
            </div>`,
        };

        await sgMail.send(msg);
        console.log(' invitation email sent successfully', msg);
        return res.status(200).send('invitation email sent successfully');

      }
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return res.status(400).send({ error });
    }
  });
});

// This function sets up an HTTP endpoint for users to send support emails directly from an application.
exports.sendSupportEmail = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests

    try {
      const { email, subject, message } = req.body; // Extract email, subject, and message from the request body

      // Validate the presence of necessary fields
      if (!email || !subject || !message) {
        // If any field is missing, return a 400 Bad Request status with an error message
        return res.status(400).send('Missing required fields: subject, message.');
      }

      console.log("email", email); // Log the sender's email for debugging purposes

      // Prepare the plain text and HTML content for the email
      const messageWithSenderInfo = `${message}\n\nThis email is from: ${email}`;
      const htmlMessageWithSenderInfo = `<p>${message}</p><br><p>This email is from: ${email}</p>`;

      // Email message setup
      const msg = {
        to: "support@gpdataservices.com", // The support team's email address
        from: 'support@gpdataservices.com', // Your verified sender email address
        subject: subject,
        text: messageWithSenderInfo,
        html: htmlMessageWithSenderInfo,
      };

      // Send the email using SendGrid's mail service
      await sgMail.send(msg);
      console.log('Support email sent successfully', msg); // Log the successful sending of the email
      return res.status(200).send('Support email sent successfully'); // Return a 200 OK status with a success message
    } catch (error) {
      // Log any errors that occur during the process of sending the email
      console.error('Error sending support email:', error.response ? error.response.body : error.message);
      // Return a 400 Bad Request status with the error message
      return res.status(400).send({ error: error.message });
    }
  })
});

// This function sets up an HTTP endpoint to allow users to update their passwords using a unique token.
exports.updatePassword = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests

    try {
      const { token, password } = req.body; // Extract token and new password from the request body

      // Validate the presence of token and password
      if (!token || !password) {
        // If token or password is missing, return a 400 Bad Request status with an error message
        return res.status(400).send('Token and password are required.');
      }

      // Find the user associated with the token
      const client = await users.findOne({ where: { token } });
      if (!client) {
        // If no user is found with the provided token, return a 400 Bad Request status with an error message
        return res.status(400).send('Invalid token.');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10); // Use bcrypt to hash the password with a salt round of 10

      // Update the user's password and clear the token in the database
      await users.update({ password: hashedPassword, token: null }, { where: { token } });

      // Return a 200 OK status with a success message
      return res.status(200).send('Password updated successfully.');
    } catch (error) {
      // Log any errors that occur during the process of updating the password
      console.error('Error updating password:', error);
      // Return a 500 Internal Server Error status with an error message
      return res.status(500).send('Error updating password.');
    }
  })
});

// This function sets up an HTTP endpoint to handle client login requests.
exports.clientLogin = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests effectively.
    const { user_email, password } = req.body; // Extract email and password from the request body.

    try {
      // Attempt to find the user in the database by email.
      const user = await users.findOne({ where: { user_email } });
      if (!user) {
        // If no user is found, return a 401 Unauthorized status with an error message.
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare the provided password with the hashed password stored in the database.
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // If the password does not match, also return a 401 Unauthorized status.
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // If authentication is successful, generate a JSON Web Token (JWT) for the user.
      const token = jwt.sign({ user_id: user.id, email: user.user_email, user, invitedBy: user.invitedBy, isEmployee: user.isEmployee }, "your_secret_key", { expiresIn: "1d" });

      // Return the token and a success message in the response.
      res.json({ message: "Login successful", token });
    } catch (error) {
      // Log any errors that occur during the login process.
      console.error("Error during login:", error);
      // Respond with a 500 Internal Server Error status and an error message.
      res.status(500).json({ message: "Internal server error" });
    }
  })
});

// This function sets up an HTTP endpoint to retrieve combined lab report data for a client.
exports.getClientReports = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization']; // Retrieve the authorization header
    console.log("header", authHeader);
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no token is present
    }

    try {
      // Decode and verify the JWT from the authorization header
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject('Forbidden'); // Reject if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information
          }
        });
      });

      console.log("user", userDecode.user);
      let email_to = userDecode.user.isEmployee ? userDecode.user.invitedBy : userDecode.user.user_email;
      const user = await users.findOne({ where: { user_email: email_to } });
      console.log("user", user)
      if (user.dataValues.isArchived == true) {
        // If no user is found with the provided email, return a 404 Not Found status.
        return res.status(400).send({ message: 'User is archived' });
      }
      // Pagination setup
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      // Retrieve lab reports from the database
      const labReports = await lab_report.findAll({
        where: { email_to },
        order: [['createdAt', 'DESC']]
      });

      if (labReports.length === 0) {
        return res.status(404).send("No lab reports found."); // No reports found
      }

      let allCombinedLabReports = [];
      for (let labReport of labReports) {
        // Retrieve CSV data related to the lab report
        const labReportCsv = await labreport_csv.findOne({
          where: { labReoprtFk: labReport.id },
          order: [['createdAt', 'DESC']]
        });

        // Retrieve all related labReportData for each labReport
        const labReportDatas = await labreport_data.findAll({
          where: { labReoprtFk: labReport.id },
          include: [{
            model: ref_range_data,
            as: 'refRangeData',
            attributes: ['refValue'],
            required: false
          }],
          order: [['createdAt', 'DESC']]
        });

        // Combine each labReportData with the labReport and CSV content
        labReportDatas.forEach(labReportData => {
          allCombinedLabReports.push({
            ...labReport.dataValues,
            ...labReportData.dataValues,
            csvContent: labReportCsv
          });
        });
      }

      // Apply pagination after combining data
      const start = (page - 1) * pageSize;
      const paginatedCombinedLabReports = allCombinedLabReports.slice(start, start + pageSize);

      // Return the combined and paginated lab reports along with pagination details
      return res.json({
        data: paginatedCombinedLabReports,
        pagination: {
          totalItems: allCombinedLabReports.length,
          totalPages: Math.ceil(allCombinedLabReports.length / pageSize),
          currentPage: page,
          pageSize
        }
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      if (error === 'Forbidden') {
        return res.sendStatus(403); // Return Forbidden if JWT verification fails
      }
      return res.status(500).json({ message: 'Internal server error', error }); // Other errors
    }
  });
});

// This function sets up an HTTP endpoint to retrieve distinct protocol IDs for a user.
exports.getProtocolIds = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader); // Log the authorization header for debugging
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization token is present
    }

    try {
      // Decode and verify the JWT from the authorization header asynchronously
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(err); // Reject the promise if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if token is valid
          }
        });
      });
      console.log("user", userDecode);

      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      // Find the users based on email_to and filter out archived users
      const usersFound = await users.findAll({
        where: { user_email: email_to }
      });

      // Filter out archived users
      const nonArchivedEmails = usersFound
        .filter(user => !user.isArchived)
        .map(user => user.user_email);

      // If all users are archived, return a message indicating so
      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All users are archived' });
      }

      // Fetch distinct protocol IDs associated with the non-archived emails
      const labReports = await lab_report.findAll({
        where: { email_to: { [Sequelize.Op.in]: nonArchivedEmails } },
        attributes: [
          // Use Sequelize function to select distinct protocol IDs
          [Sequelize.fn('DISTINCT', Sequelize.col('protocolId')), 'protocolId']
        ],
        order: [
          // Order by 'protocolId' in ascending order
          ['protocolId', 'ASC']
        ],
        raw: true
      });

      // Return the distinct protocol IDs if found
      return res.status(200).send(labReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.sendStatus(403); // Return Forbidden if JWT verification fails
      }
      return res.status(500).json({ message: 'Internal server error', error }); // Return Internal Server Error for other cases
    }
  });
});


// This function sets up an HTTP endpoint to retrieve distinct subject IDs based on protocol ID for authenticated users.
exports.getSubjectIds = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);  // Log the authorization header for debugging purposes
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization token is present
    }

    try {
      // Asynchronously verify the JWT from the authorization header to ensure valid user access
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(err); // Reject the promise if the token is invalid, leading to a forbidden status
          } else {
            resolve(user); // Resolve with the decoded user information if token is valid
          }
        });
      });

      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      // Find the users based on email_to and filter out archived users
      const usersFound = await users.findAll({
        where: { user_email: email_to }
      });

      // Filter out archived users
      const nonArchivedEmails = usersFound
        .filter(user => !user.isArchived)
        .map(user => user.user_email);

      // If all users are archived, return a message indicating so
      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All users are archived' });
      }

      const { protocolId } = req.body; // Extract protocolId from the request body

      // Validate that the protocolId is provided
      if (!protocolId) {
        return res.status(400).send("Protocol ID is required."); // Return bad request if protocolId is missing
      }

      // Fetch distinct subject IDs associated with the given protocol ID and user's email(s)
      const labReports = await lab_report.findAll({
        where: {
          protocolId,
          email_to: { [Sequelize.Op.in]: nonArchivedEmails } // Fetch only for non-archived emails
        },
        attributes: [
          [Sequelize.fn('DISTINCT', Sequelize.col('subjectId')), 'subjectId'] // Use Sequelize to select distinct subject IDs
        ],
        raw: true
      });

      // Sort the subject IDs numerically
      labReports.sort((a, b) => {
        const numA = parseInt(a.subjectId.split('-')[1], 10);
        const numB = parseInt(b.subjectId.split('-')[1], 10);
        return numA - numB;
      });

      // Return the list of distinct subject IDs if found
      return res.status(200).send(labReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError' || error.name === 'TokenExpiredError') {
        return res.sendStatus(403); // Return Forbidden if JWT verification fails
      }
      return res.status(500).json({ message: 'Internal server error', error }); // Return Internal Server Error for other cases
    }
  });
});


// This function sets up an HTTP endpoint to retrieve all non-employee users from the database.
exports.getInvitedClients = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests effectively.
    try {
      // Step 1: Fetch all clients (non-employees)
      const invitedUsers = await users.findAll({
        where: {
          isEmployee: false // Filter to include only clients
        }
      });

      // Step 2: Iterate over each client and fetch their invited employees
      const clientsWithEmployeesPromises = invitedUsers.map(async (user) => {
        // Fetch employees invited by this client
        const employees = await users.findAll({
          where: {
            invitedBy: user.user_email,
            isEmployee: true
          },
          attributes: ['user_email'] // Only fetch the employee's email
        });

        // Extract employee emails
        const employeeEmails = employees.map(emp => emp.user_email);

        // Add the employee emails to the client object
        const clientData = user.toJSON(); // Convert Sequelize model instance to plain object
        clientData.employeesInvited = employeeEmails;

        return clientData;
      });

      // Wait for all client-employee mappings to complete
      const clientsWithEmployees = await Promise.all(clientsWithEmployeesPromises);

      // Step 3: Return the modified list of clients as a JSON response
      return res.status(200).json(clientsWithEmployees);
    } catch (error) {
      // Log any errors that occur during the fetching process to the console for troubleshooting.
      console.error("Error fetching users data:", error);
      // Return a 500 Internal Server Error status if there is an issue with the database query.
      return res.status(500).send("Error fetching users data.");
    }
  });
});


// This function sets up an HTTP endpoint to retrieve all users marked as employees, optionally filtered by the inviter's email.
exports.getInvitedEmployees = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { inviterEmail } = req.query;  // Optionally get the inviter's email from query parameters

      // Define the conditions to fetch employee records from the database
      const whereConditions = {
        isEmployee: true
      };

      // If an inviter's email is provided, add it to the where conditions
      if (inviterEmail) {
        whereConditions.invitedBy = inviterEmail;
      }

      // Fetch all records from the users table based on the defined conditions
      const invitedUsers = await users.findAll({
        where: whereConditions
      });

      // Return the fetched employee records as a JSON response
      return res.status(200).json(invitedUsers);
    } catch (error) {
      // Log any errors encountered during the request processing
      console.error("Error processing request:", error);
      // Return a 500 Internal Server Error status if there are issues processing the request
      return res.status(500).send("Error processing request.");
    }
  })
});

// This function sets up an HTTP endpoint to update the access level of a user in the database.
exports.updateUserAccess = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests.
    const { email, access } = req.body; // Extract email and desired access level from the request body.

    // Check if both email and access level are provided in the request.
    if (!email || !access) {
      // Return a 400 Bad Request status if either field is missing.
      return res.status(400).send({ message: 'Email and access level must be provided.' });
    }

    try {
      // Find the user in the database by their email.
      const user = await users.findOne({ where: { user_email: email } });
      if (!user) {
        // If no user is found with the provided email, return a 404 Not Found status.
        return res.status(404).send({ message: 'User not found.' });
      }

      // Update the user's access level.
      user.access = access;
      await user.save(); // Save the updated user record to the database.

      // Return a success response indicating the access level has been updated.
      res.send({ message: 'Access level updated successfully.', user });
    } catch (error) {
      // Log any errors encountered during the process.
      console.error('Error updating user access:', error);
      // Return a 500 Internal Server Error status if there is a problem updating the access level.
      res.status(500).send({ message: 'Error updating access level.' });
    }
  })
});

// This function sets up an HTTP endpoint to retrieve a client's details based on their email address.
exports.getClientByEmail = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const { email } = req.body; // Get the email from the query parameter instead of body for progressive searching

    if (!email) {
      return res.status(400).send({ error: 'Email parameter is required.' });
    }

    try {
      // Search for all users whose emails start with the provided input
      const Users = await users.findAll({
        where: {
          user_email: {
            [Sequelize.Op.like]: `${email}%` // Use LIKE operator for progressive search
          }
        }
      });

      if (Users.length === 0) {
        return res.status(404).send({ error: 'No users found.' });
      }

      // Prepare to collect data for each user and their employees
      const result = await Promise.all(Users.map(async (user) => {
        // Find employees invited by the current user
        const employees = await users.findAll({
          where: {
            invitedBy: user.user_email,
            isEmployee: true
          },
          attributes: ['user_email'] // Only fetch the employee's email
        });

        // Extract employee emails and add them to the user's data
        const employeeEmails = employees.map(emp => emp.user_email);
        const clientData = user.toJSON(); // Convert Sequelize model instance to plain object
        clientData.employeesInvited = employeeEmails;

        return clientData; // Return the user object with employees invited
      }));

      // Send all users with their invited employees
      return res.status(200).send(result);
    } catch (error) {
      console.error('Failed to retrieve users:', error);
      res.status(500).send({ error: 'Failed to retrieve users.' });
    }
  });
});

// This function sets up an HTTP endpoint to retrieve employee details by their email.
// It searches for all users they have invited as well as their own record.
exports.getEmployeeByEmail = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests.
    const { email } = req.body; // Use query parameter for progressive searching

    // Check if the email parameter is provided.
    if (!email) {
      // Return a 400 Bad Request if the email is missing.
      return res.status(400).send({ error: 'Email parameter is required.' });
    }

    try {
      // Search for all users who were invited by the employee with the given email.
      const usersInvitedBy = await users.findAll({
        where: {
          invitedBy: {
            [Sequelize.Op.like]: `${email}%` // Use the LIKE operator for progressive matching
          },
          isEmployee: true // Ensure that only employees are considered.
        }
      });

      let result;

      if (usersInvitedBy.length > 0) {
        // If any users were invited by the employee, use this list as the result.
        result = usersInvitedBy.map(user => user.toJSON()); // Convert Sequelize models to plain objects
      } else {
        // If no invited users are found, search for the employee themselves by their email.
        const userByEmail = await users.findAll({
          where: {
            user_email: {
              [Sequelize.Op.like]: `${email}%`, // Use the LIKE operator for progressive matching
            },
            isEmployee: true
          }
        });

        // Ensure that the result is an array (even if it's a single user or empty).
        result = userByEmail.map(user => user.toJSON());
      }

      // If no result is found (neither invited users nor the employee themselves), return a 404 Not Found.
      if (result.length === 0) {
        return res.status(404).send({ error: 'User not found.' });
      }

      // Return the found users or user details with a 200 OK status.
      res.status(200).send(result);
    } catch (error) {
      // Log any errors encountered during the retrieval process.
      console.error('Failed to retrieve users:', error);
      // Return a 500 Internal Server Error if there is an exception.
      res.status(500).send({ error: 'Failed to retrieve users.' });
    }
  });
});

// This function sets up an HTTP endpoint to delete an employee from the database based on their email.
exports.deleteEmployee = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests.
    try {
      const { email, invitedBy } = req.body; // Extract the email from the request body.

      // Check if the email parameter is provided.
      if (!email) {
        // If the email is not provided, return a 400 Bad Request.
        return res.status(400).send({ message: 'Email parameter is required for deletion.' });
      }

      // Attempt to delete the user from the database who matches the email and is an employee.
      const deleteUserEmail = await users.destroy({
        where: {
          user_email: email,
          isEmployee: true,
          invitedBy: invitedBy
        }
      });

      // Check if any user was actually deleted.
      if (deleteUserEmail === 0) {
        // If no records are deleted, it means the user was not found or not an employee.
        return res.status(404).send({ message: 'No user found with the provided email to delete or not an employee.' });
      }

      // If the deletion is successful, confirm the action with a 200 OK status.
      return res.status(200).send("User deleted successfully.");
    } catch (error) {
      // Log any errors encountered during the deletion process.
      console.error('Failed to delete users:', error);
      // Return a 500 Internal Server Error if there is an exception.
      res.status(500).send({ message: 'Error deleting users.' });
    }
  })
});

exports.forgotPassword = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const { user_email } = req.body;
    if (!user_email) {
      return res.status(400).send('User email is required.');
    }

    try {
      const user = await users.findOne({ where: { user_email: user_email } });
      if (!user) {
        return res.status(404).send('User not found.');
      }

      // Generate a new token and update the user record
      const newToken = uuidv4();
      user.token = newToken;
      await user.save();
      // Remove the 'client.' subdomain from the email if it exists
      //  const inviteClientEmail = user_email.replace('client.', '');
      //  console.log("new email",inviteClientEmail)
      // Construct the password reset URL
      const resetUrl = `https://gpdataservices.com/reset-password/${newToken}`;

      // Email setup for password reset
      const msg = {
        to: user_email, // Recipient's email after modification
        from: 'support@gpdataservices.com', // Your verified sender email
        subject: 'Welcome to GP Data Services!',
        text: `Welcome to GP Data Services! We’re thrilled to have you join our community. Click the following link to reset your password: ${resetUrl}`,
        html: `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
                <h2>Welcome to GP Data Services!</h2>
                <p>We’re thrilled to have you join our community and can’t wait to collaborate with you. Our platform is built to supercharge your data management, providing you with powerful tools to organize, trend, and recruit based off of your lab data—all designed to elevate your research efforts.</p>
                <p>Together, we’ll make your data work harder and smarter for you.</p>
                <p>Know more, Achieve more, Excel more</p>
                <p>Click the link below to reset your password and dive in. We’re here to back you up every step of the way!</p>
                <p><a href="${resetUrl}" style="color: #1a73e8; text-decoration: none;">Set Your Password</a></p>
                <img src="https://storage.googleapis.com/gpdata01/image/image-3.png" style="padding-top: 20px;" width="300px"/>
              </div>`,
      };

      // Send the email
      await sgMail.send(msg);
      console.log('Password reset email sent successfully');
      res.status(200).send('Password reset email sent successfully.');
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      res.status(500).send('Failed to process password reset.');
    }
  })
});

exports.onlyLabNameSearch = onRequest({
  timeoutSeconds: 3600,
  memory: "1GiB",
}, async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.sendStatus(401); // Unauthorized if no authorization token is present
    }

    try {
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(new Error('Forbidden'));
          } else {
            resolve(user);
          }
        });
      });

      // Load the JSON mapping to get all variants for each master name
      const labToMasterMapping = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'labNameMappings.json'), 'utf8')
      );
      let originalNamesToo=[]
      // Function to retrieve all original names for selected master names
      function getOriginalNamesForMasterNames(selectedMasters) {
        let originalNames=[]

        // Process all selectedMasters
        for (const master of selectedMasters) {
          let found = false;

          // Check against all mappings
          for (const [original, mappedMaster] of Object.entries(labToMasterMapping)) {
            if (master === mappedMaster) {
              originalNames.push(original);
              originalNamesToo.push(original)
              found = true; // Mark as found
            }
          }

          // If no match was found, push the master directly
          if (!found) {
            originalNames.push(master);
          }
        }

        return originalNames;
      }


      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      // Find the users based on email_to and filter out archived users
      const usersFound = await users.findAll({
        where: { user_email: email_to }
      });

      const nonArchivedEmails = usersFound.filter(user => !user.isArchived).map(user => user.user_email);

      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All provided users are archived' });
      }

      let labReports = [];
      let pdfPath = [];
      await Promise.all(req.body.search.map(async (search) => {
        let originalLabNames = [];
        const valueCondition = {};
console.log("search",search)
        // Get all original names based on selected master names
        let masterLabNames = JSON.parse(search.lab_name_json);
        console.log("master",masterLabNames)
       const  originalLabNamesforSearch = getOriginalNamesForMasterNames(masterLabNames);
       originalLabNames.push(originalLabNamesforSearch)
        console.log("names", originalLabNames)
        // Apply minValue and maxValue conditions
        if (search.minValue !== undefined && search.maxValue !== undefined) {
          valueCondition.value = { [Sequelize.Op.between]: [search.minValue, search.maxValue] };
        } else if (search.minValue !== undefined) {
          valueCondition.value = { [Sequelize.Op.gte]: search.minValue };
        } else if (search.maxValue !== undefined) {
          valueCondition.value = { [Sequelize.Op.lte]: search.maxValue };
        }

        // Exclude non-numerical statuses
        valueCondition.value = {
          ...valueCondition.value,
          [Sequelize.Op.not]: ['pending', 'positive', 'negative']
        };

        const result = await lab_report.findAll({
          where: { email_to: { [Sequelize.Op.in]: nonArchivedEmails } },
          include: [{
            model: labreport_data,
            as: 'labreport_data',
            where: { lab_name: originalLabNames, ...valueCondition },
            required: true,
            include: [{
              model: ref_range_data,
              as: 'refRangeData',
              attributes: ['refValue'],
              required: false
            }]
          }]
        });

        labReports = labReports.concat(result.flat());
      }));
      const pdfPaths = await Promise.all(labReports.map(async (report) => {
        return pdf_email.findAll({
          where: { id: report.pdfEmailIdfk }
        });
      }));
      pdfPath = pdfPath.concat(pdfPaths.flat());

      const pdfPathMap = pdfPath.reduce((acc, pdf) => ({
        ...acc,
        [pdf.id]: pdf.dataValues.pdfPath
      }), {});
       // Helper function to transform and de-duplicate lab reports data
       function transformData(reports, pdfPathMap) {
        const uniqueReportsMap = new Map();

        reports.forEach(report => {
          if (report.labreport_data && report.labreport_data.length > 0) {
            report.labreport_data.forEach(data => {
              const uniqueKey = `${report.protocolId}-${report.investigator}-${report.subjectId}-${report.dateOfCollection}-${report.timePoint}-${report.email_to}-${report.time_of_collection}-${data.lab_name}`;

              let existingEntry = uniqueReportsMap.get(uniqueKey);
              if (!existingEntry || (existingEntry.value === "Pending" && data.value !== "Pending")) {
                const combinedData = {
                  ...report.dataValues,
                  ...data.dataValues,
                  pdfpath: pdfPathMap[report.pdfEmailIdfk],
                  labreport_data: undefined
                };
                uniqueReportsMap.set(uniqueKey, combinedData);
              }
            });
          }
        });

        return Array.from(uniqueReportsMap.values());
      }
      const transformedReports = transformData(labReports, pdfPathMap);
      
      // Check if user passed one lab name
      const allLabNames = req.body.search.flatMap(search => JSON.parse(search.lab_name_json));
      const uniqueLabNames = [...new Set(allLabNames)];
      if(allLabNames.length == 1){
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const startIndex = (page - 1) * pageSize;
        const paginatedLabReports = transformedReports.slice(startIndex, startIndex + pageSize);
  
        return res.json({
          data: transformedReports,
          pagination: {
            totalItems: transformedReports.length,
            totalPages: Math.ceil(transformedReports.length / pageSize),
            currentPage: page,
            pageSize
          }
        });
      }else{
        // Group results by protocolId and subjectId
  const reportsByProtocolAndSubject = transformedReports.reduce((acc, report) => {
    const key = `${report.protocolId}-${report.subjectId}`;
    acc[key] = (acc[key] || []).concat(report);
    return acc;
  }, {});
  // return res.status(200).send(reportsByProtocolAndSubject)
// Filter the groups based on the required lab names
// const filteredReports = filterGroupsByRequiredLabNames(reportsByProtocolAndSubject, allLabNames);
  // Filter groups to only include those with multiple reports having different lab names
  const filteredReports = Object.values(reportsByProtocolAndSubject)
  .filter(reports => {
    // Normalize and split lab names from the report data
    const labNamesInGroup = new Set(
      reports.flatMap(report => 
        typeof report.lab_name === 'string' ? report.lab_name : []
      )
    );

    // Convert the Set to an array and normalize to uppercase
    const labNamesArray = Array.from(labNamesInGroup, name => name.trim().toUpperCase());
    console.log("labarray", labNamesArray);
    const key = `${reports[0].protocolId}-${reports[0].subjectId}`;
    console.log("key",key)

    console.log("ALL NAMES", allLabNames.map(name => name.toUpperCase()));

    // Check if all required lab names are in the group (considering partial matches)
    // return allLabNames.every(requiredName => {
    //   // Extract key terms from requiredName
    //   const keyTerms = requiredName.toUpperCase().split(' ').filter(term => term.length > 3); // ignoring short words
    //   console.log("keyterms",keyTerms)
    //   return labNamesArray.some(labName => 
        
    //     keyTerms.every(term => labName.includes(term))
    //   );
    // });
    // Compare the count of unique lab names to the count of required lab names
    return labNamesArray.length >= allLabNames.length;
  })
  .flat();

  if (filteredReports.length === 0) {
    return res.status(404).send({ message: 'No matching records found.' });
  }
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const startIndex = (page - 1) * pageSize;
  const paginatedLabReports = transformedReports.slice(startIndex, startIndex + pageSize);

  return res.json({
    data: filteredReports,
    pagination: {
      totalItems: filteredReports.length,
      totalPages: Math.ceil(filteredReports.length / pageSize),
      currentPage: page,
      pageSize
    }
  });
      }
      // Check if there's only one record
      // if (labReports.length === 1) {
      //   const transformedReports = transformData(labReports, pdfPathMap);
      //   return res.json({
      //     data: transformedReports,
      //     pagination: {
      //       totalItems: 1,
      //       totalPages: 1,
      //       currentPage: 1,
      //       pageSize: 1
      //     }
      //   });
      // }

      // if (labReports.length > 0) {
      //   const { protocolId, subjectId } = labReports[0];
      //   const allSame = labReports.every(report => 
      //     report.protocolId === protocolId && report.subjectId === subjectId
      //   );

      // if (allSame) {
      // const transformedReports = transformData(filteredReports, pdfPathMap);
      // const page = parseInt(req.query.page) || 1;
      // const pageSize = parseInt(req.query.pageSize) || 10;
      // const startIndex = (page - 1) * pageSize;
      // const paginatedLabReports = transformedReports.slice(startIndex, startIndex + pageSize);

      // return res.json({
      //   data: filteredReports,
      //   pagination: {
      //     totalItems: transformedReports.length,
      //     totalPages: Math.ceil(transformedReports.length / pageSize),
      //     currentPage: page,
      //     pageSize
      //   }
      // });
      // } else {
      //   return res.status(400).send({ message: 'Records have different protocolId or subjectId' });
      // }
      // } else {
      //   return res.status(400).send({ message: 'No lab reports found' });
      // }
    } catch (error) {
      console.error('Error in processing:', error);
      if (error.message === 'Forbidden') {
        return res.sendStatus(403);
      }
      return res.status(500).send("Internal server error");
    }
  });
});


exports.getLabReportNamesByEmailForSearch = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader); // Log the received authorization header for debugging
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization token is present
    }

    try {
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(new Error('Forbidden')); // Reject the promise if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if the token is valid
          }
        });
      });

      // Load the lab name mappings from JSON file
      const labToMasterMapping = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'labNameMappings.json'), 'utf8')
      );

      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      // Find the users based on email_to and filter out archived users
      const usersFound = await users.findAll({
        where: { user_email: email_to }
      });

      const nonArchivedEmails = usersFound.filter(user => !user.isArchived).map(user => user.user_email);

      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All provided users are archived' });
      }

      // Perform a database query to fetch lab reports matching the specified criteria
      const labReports = await lab_report.findAll({
        where: { email_to: { [Sequelize.Op.in]: nonArchivedEmails } },
        attributes: ['id'] // Only fetch the 'id' attribute for minimal data retrieval
      });

      if (labReports.length === 0) {
        return res.status(404).send("No lab reports found for the given emails."); // Handle case with no matches
      }

      // Extract IDs from the lab reports to fetch corresponding lab data
      const labReportIds = labReports.map(report => report.id);

      // Fetch unique lab names from labreport_data using the extracted IDs
      const labReportData = await labreport_data.findAll({
        where: {
          labReoprtFk: labReportIds,
          value: {
            [Sequelize.Op.not]: ['pending', 'positive', 'negative'] // Exclude non-numerical statuses
          }
        },
        attributes: ['lab_name'],
        group: ['lab_name'] // Group by 'lab_name' to ensure uniqueness
      });

      // Array of objects with original and master name pairs
      const labNamesWithMaster = labReportData.map(data => {
        const originalName = data.lab_name;
        const masterName = labToMasterMapping[originalName] || originalName;
        return masterName;
      });
      // Use Set to ensure uniqueness
      const uniqueLabNames = Array.from(new Set(labNamesWithMaster));

      // Return the array of unique values
      return res.json({ labNames: uniqueLabNames });
    } catch (error) {
      if (error.message === 'Forbidden') {
        return res.sendStatus(403); // Forbidden status if JWT verification fails
      }
      console.error('Error:', error); // Log any errors for debugging
      return res.status(500).send("Internal server error"); // Return Internal Server Error for other cases
    }
  });
});


exports.signPdf = onRequest({
  timeoutSeconds: 3600, // Set the function timeout to 1 hour
}, async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader); // Log the received authorization header for debugging
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization header is present
    }

    try {
      // Decode and verify the JWT from the authorization header asynchronously
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject('Forbidden'); // Reject the promise if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if the token is valid
          }
        });
      });
      console.log("user", userDecode);

      const { pdfUrl } = req.body; // Use a URL in the request body
      const apiUrl = "https://gpdataservices.com/fetch-co-ordinates";
      const { coordinates } = await coordinateExtraction(pdfUrl, apiUrl);
            // const coordinates = 
            // {
            //   "page_1": [
            //     [
            //       762.476,
            //       439.06509375,
            //       "BASE"
            //     ],
            //     [
            //       762.476,
            //       453.46509375000005,
            //       "met"
            //     ],
            //     [
            //       762.476,
            //       482.26509375,
            //       "BASE"
            //     ],
            //     [
            //       762.476,
            //       496.66509375000004,
            //       "met"
            //     ],
            //     [
            //       762.476,
            //       525.46509375,
            //       "BL"
            //     ],
            //     [
            //       762.476,
            //       539.86509375,
            //       "met"
            //     ],
            //     [
            //       762.476,
            //       568.66509375,
            //       "BASE"
            //     ],
            //     [
            //       762.476,
            //       583.0650937500001,
            //       "met"
            //     ],
            //     [
            //       762.476,
            //       611.86509375,
            //       "BASE"
            //     ],
            //     [
            //       762.476,
            //       626.26509375,
            //       "met"
            //     ],
            //     [
            //       762.476,
            //       655.0650937500001,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       669.4650937499999,
            //       "]"
            //     ],
            //     [
            //       762.476,
            //       698.26509375,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       712.66509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       741.4650937499999,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       755.8650937499999,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       784.66509375,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       827.8650937499999,
            //       "GRADING"
            //     ],
            //     {
            //       "signature_coordinates": [
            //         176.500732421875,
            //         875.998046875
            //       ],
            //       "date_coordinates": [
            //         530.000732421875,
            //         885.998046875
            //       ],
            //       "comments_coordinates": [
            //         323.500732421875,
            //         858.5968017578125
            //       ]
            //     }
            //   ],
            //   "page_2": [
            //     [
            //       762.476,
            //       442.90509375000005,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       442.90509375000005,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       457.30509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       457.30509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       457.30509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       457.30509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       457.30509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       457.30509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       486.10509375000004,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       486.10509375000004,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       500.50509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       500.50509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       500.50509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       500.50509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       500.50509375,
            //       "Met"
            //     ],
            //     [
            //       762.476,
            //       529.30509375,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       529.30509375,
            //       "GRADING"
            //     ],
            //     [
            //       762.476,
            //       543.7050937500001,
            //       "]"
            //     ],
            //     [
            //       762.476,
            //       799.3546875000001,
            //       "required."
            //     ],
            //     {
            //       "signature_coordinates": [
            //         176.500732421875,
            //         830.998046875
            //       ],
            //       "date_coordinates": [
            //         530.000732421875,
            //         840.998046875
            //       ],
            //       "comments_coordinates": [
            //         323.500732421875,
            //         814.498046875
            //       ]
            //     }
            //   ]
            // }
      console.log("coordinates", coordinates);
      const dateCoords = coordinates.date_coordinates;
      const signCoords = coordinates.signature_coordinates;
      const commentCoords = coordinates.comments_coordinates

      const parts = pdfUrl.split('/');
      const pdfName = parts[parts.length - 1];

      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const pdfBuffer = response.data;
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();

      const fields = [];

     // Assuming pageCount and userDecode are defined elsewhere in your code
     for (let i = 1; i <= pageCount; i++) {
      // Fetch coordinates for the current page
      const pageCoordinates = coordinates[`page_${i}`];
      
      pageCoordinates.forEach(coord => {
        console.log("coorde",coord)
        if (coord.signature_coordinates) {
          const signCoords = coord.signature_coordinates;
          const dateCoords = coord.date_coordinates;
          const commentCoords = coord.comments_coordinates;
    
          // Push fields for signature, date, and comments if they exist
          fields.push(
            {
              type: 'signature',
              required: true,
              fixed_width: false,
              x: signCoords[0], // X coordinate for signature
              y: signCoords[1], // Y coordinate for signature
              page: i,
              recipient_id: userDecode.user_id
            },
            {
              type: 'date',
              required: true,
              fixed_width: false,
              lock_sign_date: true, // Locks the date to auto-populate
              x: dateCoords[0], // X coordinate for date
              y: dateCoords[1], // Y coordinate for date
              page: i,
              recipient_id: userDecode.user_id,
              date_format: 'MM/DD/YYYY'
            }
          );
    
          // Check if comments_coordinates exists and add a text field
          if (commentCoords) {
            fields.push(
              {
                type: 'text',
                required: false,
                fixed_width: false,
                x: commentCoords[0], // X coordinate for comments
                y: commentCoords[1], // Y coordinate for comments
                page: i,
                recipient_id: userDecode.user_id,
              }
            );
          }
        }else {
          // For all other coordinates (non-signature, date, or comments), add them as text fields
          fields.push({
            type: 'text',
            required: false,
            fixed_width: false,
            x: coord[0], // X coordinate
            y: coord[1], // Y coordinate
            page: i,
            recipient_id: userDecode.user_id
          });
        }
      });
    }
    

      // Add additional fields based on specific coordinates for each page
      // Object.keys(coordinates).forEach((pageKey) => {
      //   if (pageKey.startsWith('page')) {
      //     console.log("pagw",pageKey)
      //     const pageNumber = parseInt(pageKey.split('_')[1]); // Extract page number from key
      //     console.log("no",pageNumber)
      //     const pageCoordinates = coordinates[pageKey];

      //     // Loop through each coordinate on the current page to create custom fields
      //     pageCoordinates.forEach(coord => {
      //       fields.push({
      //         type: 'text',
      //         required: false,
      //         fixed_width: false,
      //         x: coord[0], // Multiply X coordinate
      //         y: coord[1] , // Multiply Y coordinate
      //         page: pageNumber,
      //         recipient_id: userDecode.user_id
      //       });
      //     });
      //   }
      // });


      console.log(`The PDF has ${pageCount} pages.`);
      console.log("Fields for signing", fields);

      signwell.auth('YWNjZXNzOjFhMTFjMzhkY2RkNDZhMWZlNDZkNDIyNGM5ODM1NTBj');
      const signUrl = await signwell.postApiV1Documents({
        test_mode: true,
        draft: false,
        with_signature_page: false,
        reminders: true,
        apply_signing_order: false,
        embedded_signing: false,
        embedded_signing_notifications: false,
        text_tags: false,
        allow_decline: true,
        allow_reassign: true,
        files: [
          {
            name: pdfName,
            file_url: pdfUrl
          }
        ],
        recipients: [
          {
            send_email: false,
            send_email_delay: 0,
            id: userDecode.user_id,
            email: userDecode.email
          }
        ],
        fields: [fields]
      });

      console.log("Signed PDF", signUrl.data.id);
      const signedPdf = await signedPdfs.create({
        pdf_id: signUrl.data.id,
        pdfEmailIdfk: req.body.pdfId,
        signedBy: userDecode.email,
        protocolId: req.body.protocolId,
        subjectId: req.body.subjectId,
        dateOfCollection: req.body.dateOfCollection,
        timePoint: req.body.timePoint
      });

      return res.status(200).send(`Document processed successfully ${JSON.stringify(signUrl)}`);
    } catch (err) {
      if (err === 'Forbidden') {
        return res.sendStatus(403); // Forbidden status if JWT verification fails
      }
      if (err.response) {
        console.error('Invalid keys:', err);
        console.error('Error message:', err);
        return res.status(400).send(err.response.data);
      } else {
        console.error('Error:', err);
        return res.status(500).send("Internal server error", err);
      }
    }
  });
});

exports.signWebhook = onRequest({
  timeoutSeconds: 3600, // Set the function timeout to 1 hour
  memory: "1GiB", // Allocate 1 GiB of memory to the function
}, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.body && req.body.event.type === "document_completed") {
        const data = req.body.data.object; // Assuming the object holds the required data
        console.log("Document Data:", data);

        // Ensure the uploads directory exists
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }

        // Find the record in the signedPdfs table
        const pdfRecord = await signedPdfs.findOne({
          where: { pdf_id: data.id } // Adjust this if necessary
        });

        if (!pdfRecord) {
          return res.status(404).send('Record not found');
        }

        // Retrieve the PDF URL using Signwell API
        signwell.auth('YWNjZXNzOjFhMTFjMzhkY2RkNDZhMWZlNDZkNDIyNGM5ODM1NTBj');
        const pdfUrlData = await signwell.getApiV1DocumentsIdCompleted_pdf({
          url_only: 'true',
          audit_page: 'false',
          id: data.id
        });
        console.log("PDF URL Data:", pdfUrlData)
        const pdfUrl = pdfUrlData.data.file_url;
        let cleanUrl = pdfUrl.split('?')[0]; // This splits the URL at the '?' and takes the first part.
        const newData = {
          name: data.name,
          id: data.id  // Adjust accordingly if needed
        };
        console.log("New Data:", newData)
        // Call UploadFile function to handle PDF renaming, uploading, and database updating
        const uploadResult = await UploadFile(cleanUrl, newData);

        // Return success message
        return res.status(200).send(`PDF processed and uploaded successfully: ${uploadResult.destination}`);
      } else {
        console.log("here")
        // Return 200 OK for other event types to prevent API crashes
        return res.status(200).send("Received non-critical event type; no action taken.");
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send(`Server error: ${error.message}`);
    }
  });
});

exports.archiveUser = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests.
    const { email, isArchive } = req.body; // Extract email and desired access level from the request body.
    console.log("email , isarachive", email, isArchive)
    // Check if both email and access level are provided in the request.
    if (!email || isArchive === undefined) {
      // Return a 400 Bad Request status if either field is missing.
      return res.status(400).send({ message: 'Email and archive must be provided.' });
    }

    try {
      // Find the user in the database by their email.
      const user = await users.findOne({ where: { user_email: email } });
      if (!user) {
        // If no user is found with the provided email, return a 404 Not Found status.
        return res.status(404).send({ message: 'User not found.' });
      }

      // Update the user's access level.
      user.isArchived = isArchive;
      await user.save(); // Save the updated user record to the database.

      // Return a success response indicating the access level has been updated.
      return res.send({ message: 'User updated successfully.', user });
    } catch (error) {
      // Log any errors encountered during the process.
      console.error('Error updating user access:', error);
      // Return a 500 Internal Server Error status if there is a problem updating the access level.
      return res.status(500).send({ message: 'Error updating access level.' });
    }
  })
})

exports.getArchiveUsers = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const archivedUsers = await users.findAll({
        where: {
          isArchived: true
        }
      });
      const clientsWithEmployeesPromises = archivedUsers.map(async (user) => {
        // Fetch employees invited by this client
        const employees = await users.findAll({
          where: {
            invitedBy: user.user_email,
            isEmployee: true
          },
          attributes: ['user_email'] // Only fetch the employee's email
        });

        // Extract employee emails
        const employeeEmails = employees.map(emp => emp.user_email);

        // Add the employee emails to the client object
        const clientData = user.toJSON(); // Convert Sequelize model instance to plain object
        clientData.employeesInvited = employeeEmails;

        return clientData;
      });

      // Wait for all client-employee mappings to complete
      const clientsWithEmployees = await Promise.all(clientsWithEmployeesPromises);
      return res.status(200).json(clientsWithEmployees);
    } catch (error) {
      console.log("error", error)
      return res.status(500).json({ error: 'An error occurred while fetching archived users', details: error.message });
    }
  })
})

exports.getPdfsForEmail = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);  // Log the received authorization header for debugging
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization header is present
    }

    try {
      // Decode and verify the JWT from the authorization header asynchronously
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(new Error('Forbidden')); // Reject the promise if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if the token is valid
          }
        });
      });

      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      // Find the users based on email_to and filter out archived users
      const usersFound = await users.findAll({
        where: { user_email: email_to }
      });

      const nonArchivedEmails = usersFound.filter(user => !user.isArchived).map(user => user.user_email);

      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All provided users are archived' });
      }

      const results = await pdf_email.findAll({
        where: {
          email_to: { [Sequelize.Op.in]: nonArchivedEmails },
          isSigned: false
        },
        include: [
          {
            model: lab_report,
            as: 'labReports',
            attributes: ['protocolId', 'subjectId', 'dateOfCollection', 'timePoint'],
            where: {
              protocolId: { [Sequelize.Op.ne]: null },
              subjectId: { [Sequelize.Op.ne]: null }
            }
          }
        ]
      });

      // Flatten the results
      const formattedResults = results.map(email => {
        const firstReport = email.labReports[0] || {}; // Take the first lab report, if it exists
        return {
          id: email.id,
          userEmailFk: email.userEmailFk,
          email_to: email.email_to,
          receivedAt: email.receivedAt,
          pdfName: email.pdfName,
          pdfPath: email.pdfPath,
          isSigned: email.isSigned,
          createdAt: email.createdAt,
          updatedAt: email.updatedAt,
          protocolId: firstReport.protocolId || null,
          subjectId: firstReport.subjectId || null,
          dateOfCollection: firstReport.dateOfCollection || null,
          timePoint: firstReport.timePoint || null
        };
      });

      console.log(formattedResults);


      return res.status(201).send(formattedResults); // Send the fetched lab reports as a response
    } catch (error) {
      if (error === 'Forbidden') {
        return res.sendStatus(403); // Forbidden status if JWT verification fails
      }
      console.error('Error:', error); // Log any errors for debugging
      return res.status(500).send("Internal server error"); // Return Internal Server Error for other cases
    }
  });
});

exports.getArchiveUsersOnEmail = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const userEmail = req.body.email; // Get email from the query parameter

    try {
      if (!userEmail) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find all users whose email matches the provided input and are archived
      const Users = await users.findAll({
        where: {
          user_email: {
            [Sequelize.Op.like]: `${userEmail}%` // Adjust to use LIKE for progressive searching
          },
          isArchived: true
        }
      });

      if (Users.length === 0) {
        return res.status(404).json({ error: 'No archived users found with the provided email' });
      }

      // Prepare the final result including employees invited by each user
      const result = await Promise.all(Users.map(async (user) => {
        // Fetch employees invited by this archived user
        const employees = await users.findAll({
          where: {
            invitedBy: user.user_email,
            isEmployee: true
          },
          attributes: ['user_email'] // Only fetch the employee's email
        });

        // Extract employee emails
        const employeeEmails = employees.map(emp => emp.user_email);

        // Add the employee emails to the user object
        const clientData = user.toJSON(); // Convert Sequelize model instance to plain object
        clientData.employeesInvited = employeeEmails;

        return clientData; // Return the user object with employees invited
      }));

      return res.status(200).json(result); // Send all the users with their invited employees
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({ error: 'An error occurred while fetching the archived users', details: error.message });
    }
  });
});
exports.getSignedPdf = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader); // Log the received authorization header for debugging
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization header is present
    }

    try {
      // Decode and verify the JWT from the authorization header asynchronously
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(new Error('Forbidden')); // Reject the promise if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if the token is valid
          }
        });
      });

      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      // Find the users based on email_to and filter out archived users
      const usersFound = await users.findAll({
        where: { user_email: email_to }
      });

      const nonArchivedEmails = usersFound.filter(user => !user.isArchived).map(user => user.user_email);

      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All provided users are archived' });
      }

      // Perform a database query to fetch signed PDFs matching the specified criteria
      const labReports = await signedPdfs.findAll({
        where: {
          email_to: { [Sequelize.Op.in]: nonArchivedEmails },
          isSigned: true,
          isPrinted: false
        }
      });
      console.log("reports", labReports)
      // Add page count for each PDF in the response
      const labReportsWithPageCount = await Promise.all(
        labReports.map(async (report) => {
          console.log("report", report.dataValues.pdfUrl)
          const pdfPath = `https://storage.googleapis.com/gpdata01/${report.dataValues.pdfUrl}`; // Assuming `filePath` contains the path to the PDF
          try {
            const response = await axios.get(pdfPath, { responseType: 'arraybuffer' });
            const pdfBuffer = response.data;
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const pageCount = pdfDoc.getPageCount();
            return {
              ...report.dataValues, // Include the original report fields
              pageCount // Add the page count
            };
          } catch (err) {
            console.error(`Error reading PDF file for report ID ${report.id}:`, err);
            return {
              ...report.dataValues,
              pageCount: null, // Set to null if there's an error reading the file
            };
          }
        })
      );

      return res.status(201).send(labReportsWithPageCount); // Send the signed PDFs with page counts as a response
    } catch (error) {
      if (error.message === 'Forbidden') {
        return res.sendStatus(403); // Forbidden status if JWT verification fails
      }
      console.error('Error:', error); // Log any errors for debugging
      return res.status(500).send("Internal server error"); // Return Internal Server Error for other cases
    }
  });
});


exports.deleteUser = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const { id } = req.query;

    try {
      // Start a transaction

      const user = await users.findOne({ where: { id } });
      if (!user) {
        throw new Error('User not found');
      }
      const userEmail = user.dataValues.user_email
      console.log("id", userEmail)
      const pdfEmailIds = await pdf_email.findAll({ where: { userEmailFk: id }, attributes: ['id'], });
      const emailIds = pdfEmailIds.map(email => email.dataValues.id);
      const labReports = await lab_report.findAll({
        where: {
          pdfEmailIdfk: {
            [Op.in]: emailIds
          }
        },
        attributes: ['id'], // Selecting only 'id' attribute
      });

      // Extracting and logging only the IDs from the lab report records
      const labReportIds = labReports.map(report => report.id);
      const labReportDataRecords = await labreport_data.findAll({
        where: {
          labReoprtFk: {
            [Op.in]: labReportIds
          }
        },
        attributes: ['id'], // Selecting only 'id' attribute
      });

      // Extracting and logging only the IDs from the lab report data records
      const labReoprtDataIds = labReportDataRecords.map(data => data.id);
      const labReportCsvRecords = await labreport_csv.findAll({
        where: {
          labReoprtFk: {
            [Op.in]: labReportIds
          }
        },
        attributes: ['id'], // Selecting only 'id' attribute
      });

      // Extracting and logging only the IDs from the lab report CSV records
      const labReportCsvIds = labReportCsvRecords.map(csv => csv.id);
      // Start transaction
      const result = await sequelize.transaction(async (t) => {

        // Deleting records from labreport_data
        const deleteData = await labreport_data.destroy({
          where: {
            labReoprtFk: {
              [Op.in]: labReportIds
            }
          },
          transaction: t
        });

        //  Deleting records from labreport_csv
        const deleteCsv = await labreport_csv.destroy({
          where: {
            labReoprtFk: {
              [Op.in]: labReportIds
            }
          },
          transaction: t
        });

        //  Deleting records from lab_report
        const deleteLabReport = await lab_report.destroy({
          where: {
            pdfEmailIdfk: {
              [Op.in]: emailIds
            }
          },
          transaction: t
        });
         //  Deleting records from lab_report
         const deleteSignedPdfs = await signedPdfs.destroy({
          where: {
            pdfEmailIdfk: {
              [Op.in]: emailIds
            }
          },
          transaction: t
        });

        // Deleting records from lab_report
        const deletePdfEmail = await pdf_email.destroy({
          where: {
            userEmailFk: id
          },
          transaction: t
        });

        const invitedUsersDeletion = await users.destroy({
          where: {
            invitedBy: userEmail // Assuming invitedBy is stored as a string matching the primary user's id
          },
          transaction: t
        });

        // Log how many invited users were deleted (optional)
        console.log(`${invitedUsersDeletion} invited users deleted.`);

        const deleteUser = await users.destroy({
          where: {
            id: id
          },
          transaction: t
        });
        // return{deletePdfEmail}

        return { deleteData, deleteCsv, deleteLabReport, deletePdfEmail, invitedUsersDeletion, deleteUser,deleteSignedPdfs };
      });

      console.log("Deletion results:", result);
      console.log("User ID:", user.id);
      console.log("PDF Email IDs:", emailIds);
      console.log("Lab Report IDs:", labReportIds);
      console.log("Lab Report Data IDs:", labReoprtDataIds);
      console.log("Lab Report CSV IDs:", labReportCsvIds)

      return res.status(200).send({ message: 'User and all related records have been deleted.' });
    } catch (error) {
      console.error('Error during deletion:', error);
      return res.status(500).send({ error: error.message || 'Internal server error' });
    }
  })
})

exports.getEmployeeClients = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);  // Log the received authorization header for debugging
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization header is present
    }
    try {
      // Decode and verify the JWT from the authorization header asynchronously
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject('Forbidden'); // Reject the promise if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if the token is valid
          }
        });
      });
      const loggedInEmail = userDecode.email

      // Find the user by email
      const user = await users.findOne({
        where: { user_email: loggedInEmail }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Find all records where this user was invited
      const invitations = await users.findAll({
        where: {
          user_email: loggedInEmail,
          invitedBy: {
            [Op.ne]: null // Only get records where invitedBy is not null
          }
        },
        attributes: ['invitedBy'] // Only return the invitedBy field
      });

      // If no invitations found
      if (!invitations.length) {
        return res.status(200).json({ message: 'No invitations found', invitedByEmails: [] });
      }

      // Extract the list of unique invitedBy emails
      const invitedByEmails = invitations.map(invite => invite.invitedBy);

      return res.status(200).json({ invitedByEmails });
    } catch (error) {
      console.error('Error fetching invited by emails:', error.message);
      return res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  })
})

exports.printedPdfs = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);  // Log the received authorization header for debugging
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization header is present
    }
    try {
      // Decode and verify the JWT from the authorization header asynchronously
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject('Forbidden'); // Reject the promise if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if the token is valid
          }
        });
      });
      const loggedInEmail = userDecode.email

      // Find the user by email
      const user = await users.findOne({
        where: { user_email: loggedInEmail }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { printArray } = req.body
      for (const print of printArray) {
        const { id, pdf_id, pdfEmailIdfk, pdfUrl, isSigned, email_to, signedBy, protocolId, subjectId, dateOfCollection, timePoint } = print
        await signedPdfs.update(
          { isPrinted: true },
          { where: { id } }
        );
        await printedPdfs.create({
          pdfEmailIdfk,
          pdfUrl,
          isSigned,
          isPrinted: true,
          email_to,
          signedBy,
          printedBy: loggedInEmail,
          protocolId,
          subjectId,
          dateOfCollection,
          timePoint,
          createdAt: new Date(),
        })
      }

      return res.status(200).json({ message: 'PDF records processed successfully' });
    } catch (error) {
      console.error('Error processing PDFs:', error);
      return res.status(500).json({ message: 'Internal Server Error', error });
    }
  })
})

exports.getPrintedPdf = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);  // Log the received authorization header for debugging
    if (!authHeader) {
      return res.sendStatus(401); // Return Unauthorized if no authorization header is present
    }

    try {
      // Decode and verify the JWT from the authorization header asynchronously
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(new Error('Forbidden')); // Reject the promise if the token is invalid
          } else {
            resolve(user); // Resolve with the decoded user information if the token is valid
          }
        });
      });

      // Get email_to from the request body
      let email_to = req.body.email_to;

      // Ensure email_to is an array and provided
      if (!email_to || !Array.isArray(email_to) || email_to.length === 0) {
        return res.status(400).send("Email_to array is required.");
      }

      // Find the users based on email_to and filter out archived users
      const usersFound = await users.findAll({
        where: { user_email: email_to }
      });

      const nonArchivedEmails = usersFound.filter(user => !user.isArchived).map(user => user.user_email);

      if (nonArchivedEmails.length === 0) {
        return res.status(400).send({ message: 'All provided users are archived' });
      }

      // Perform a database query to fetch signed PDFs matching the specified criteria
      const labReports = await printedPdfs.findAll({
        where: {
          email_to: { [Sequelize.Op.in]: nonArchivedEmails },
          isSigned: true,
          isPrinted: true
        }
      });

      return res.status(201).send(labReports); // Send the signed PDFs as a response
    } catch (error) {
      if (error === 'Forbidden') {
        return res.sendStatus(403); // Forbidden status if JWT verification fails
      }
      console.error('Error:', error); // Log any errors for debugging
      return res.status(500).send("Internal server error"); // Return Internal Server Error for other cases
    }
  });
});

exports.getAnalyticsData = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Fetch all employees grouped by their invitedBy
      const employees = await users.findAll({
        where: {
          isEmployee: true,
        },
        attributes: ["id", "user_email", "invitedBy", "createdAt", "updatedAt"],
      });

      // Create a mapping of employees by invitedBy
      const employeesByInviter = employees.reduce((acc, employee) => {
        if (employee.invitedBy) {
          acc[employee.invitedBy] = acc[employee.invitedBy] || [];
          acc[employee.invitedBy].push({
            employeeId: employee.id,
            employeeEmail: employee.user_email,
            employeeCreatedAt: employee.createdAt,
            employeeUpdatedAt: employee.updatedAt,
          });
        }
        return acc;
      }, {});

      // Fetch clients and associated PDFs and lab reports
      const clients = await users.findAndCountAll({
        where: {
          isEmployee: false,
        },
        include: [
          {
            model: pdf_email,
            as: "pdfs",
            include: [
              {
                model: lab_report,
                as: "labReports",
              },
            ],
          },
        ],
        distinct: true,
      });

      // Helper function to format file sizes
      function formatFileSize(sizeInKB) {
        if (sizeInKB > 1000) {
          const sizeInMB = (sizeInKB / 1000).toFixed(2); // Convert to MB and round to 2 decimal places
          return `${sizeInMB} MB`;
        }
        return `${sizeInKB.toFixed(2)} KB`; // Round to 2 decimal places for KB
      }

      // Calculate the total PDF count, total size, and format client data
      const formattedClients = clients.rows.map((user) => {
        const invitedEmployees = employeesByInviter[user.user_email] || [];

        // Calculate the total file size for all PDFs
        const totalFileSizeInKB = user.pdfs.reduce((total, pdf) => {
          return total + (pdf.fileSize || 0); // Add fileSize or 0 if null
        }, 0);

        return {
          userId: user.id,
          userEmail: user.user_email,
          pdfCount: user.pdfs.length,
          totalFileSize: formatFileSize(totalFileSizeInKB), // Format the file size
          invitedEmployeesCount: invitedEmployees.length,
          invitedEmployees,
          pdfs: user.pdfs.map((pdf) => {
            return pdf.labReports.length > 0
              ? pdf.labReports.map((labReport) => ({
                  pdfId: pdf.id,
                  emailTo: pdf.email_to,
                  receivedAt: pdf.receivedAt,
                  pdfPath: pdf.pdfPath,
                  isSigned: pdf.isSigned,
                  pdfCreatedAt: pdf.createdAt,
                  pdfUpdatedAt: pdf.updatedAt,
                  fileSize: formatFileSize(pdf.fileSize || 0), // Format the file size
                  labReportId: labReport.id,
                  protocolId: labReport.protocolId,
                  investigator: labReport.investigator,
                  subjectId: labReport.subjectId,
                  dateOfCollection: labReport.dateOfCollection,
                  timePoint: labReport.timePoint,
                  timeOfCollection: labReport.time_of_collection,
                  labReportCreatedAt: labReport.createdAt,
                }))
              : [
                  {
                    pdfId: pdf.id,
                    emailTo: pdf.email_to,
                    receivedAt: pdf.receivedAt,
                    pdfPath: pdf.pdfPath,
                    isSigned: pdf.isSigned,
                    pdfCreatedAt: pdf.createdAt,
                    pdfUpdatedAt: pdf.updatedAt,
                    fileSize: formatFileSize(pdf.fileSize || 0), // Format the file size
                  },
                ];
          }).flat(),
        };
      });

      // Calculate the total size across all clients
      const totalSizeAcrossClientsInKB = formattedClients.reduce(
        (total, client) => {
          const size = parseFloat(client.totalFileSize.replace(/[^0-9.]/g, ""));
          const isMB = client.totalFileSize.includes("MB");
          return total + (isMB ? size * 1000 : size); // Convert MB to KB before summing
        },
        0
      );

      // Format the total size across clients
      const totalSizeAcrossClients = formatFileSize(totalSizeAcrossClientsInKB);

      // Return the response
      return res.status(200).send({
        clientCount: clients.count,
        totalPdfCount: clients.rows.reduce((count, client) => count + client.pdfs.length, 0),
        totalSizeAcrossClients, // Add the total size across all clients
        formattedClients,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({ message: "Internal server error", error });
    }
  });
});




exports.getSignedAndPrintedPdfs = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Fetch signed PDFs where isSigned is true
      const SignedPdfs = await signedPdfs.findAll({
        where: {
          isSigned: true,
        },
        attributes: [
          "pdf_id",
          "pdfEmailIdfk",
          "email_to",
          "signedBy",
          "protocolId",
          "subjectId",
          "dateOfCollection",
          "timePoint",
          "pdfUrl",
        ],
      });

      // Fetch printed PDFs where isPrinted is true
      const PrintedPdfs = await printedPdfs.findAll({
        where: {
          isPrinted: true,
        },
        attributes: [
          "pdfEmailIdfk",
          "email_to",
          "printedBy",
          "protocolId",
          "subjectId",
          "dateOfCollection",
          "timePoint",
          "pdfUrl",
        ],
      });

      // Combine and group by client email (email_to)
      const groupedByClient = {};

      // Add signed PDFs to the grouped structure
      SignedPdfs.forEach((pdf) => {
        const clientEmail = pdf.email_to || "Unknown";
        if (!groupedByClient[clientEmail]) {
          groupedByClient[clientEmail] = {
            clientEmail,
            signedPdfs: [],
            printedPdfs: [],
            signedPdfCount: 0,
            printedPdfCount: 0,
          };
        }
        groupedByClient[clientEmail].signedPdfs.push({
          pdfId: pdf.pdf_id,
          pdfEmailIdfk: pdf.pdfEmailIdfk,
          signedBy: pdf.signedBy,
          protocolId: pdf.protocolId,
          subjectId: pdf.subjectId,
          dateOfCollection: pdf.dateOfCollection,
          timePoint: pdf.timePoint,
          pdfUrl: pdf.pdfUrl,
        });
        groupedByClient[clientEmail].signedPdfCount++;
      });

      // Add printed PDFs to the grouped structure
      PrintedPdfs.forEach((pdf) => {
        const clientEmail = pdf.email_to || "Unknown";
        if (!groupedByClient[clientEmail]) {
          groupedByClient[clientEmail] = {
            clientEmail,
            signedPdfs: [],
            printedPdfs: [],
            signedPdfCount: 0,
            printedPdfCount: 0,
          };
        }
        groupedByClient[clientEmail].printedPdfs.push({
          pdfEmailIdfk: pdf.pdfEmailIdfk,
          printedBy: pdf.printedBy,
          protocolId: pdf.protocolId,
          subjectId: pdf.subjectId,
          dateOfCollection: pdf.dateOfCollection,
          timePoint: pdf.timePoint,
          pdfUrl: pdf.pdfUrl,
        });
        groupedByClient[clientEmail].printedPdfCount++;
      });

      // Convert the grouped object to an array for easier representation
      const response = Object.values(groupedByClient);

      // Return the response
      return res.status(200).send({
        totalSignedPdfCount: SignedPdfs.length,
        totalPrintedPdfCount: PrintedPdfs.length,
        data: response,
      });
    } catch (error) {
      console.error("Error fetching signed and printed PDFs:", error);
      return res.status(500).send({
        message: "Internal server error",
        error,
      });
    }
  });
});

exports.getClientData = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { clientEmail, startDate, endDate } = req.body;

      // Validate clientEmail, startDate, and endDate
      if (!clientEmail || !startDate || !endDate) {
        return res.status(400).send({ message: "Missing required fields" });
      }

      // Fetch client data
      const client = await users.findOne({
        where: {
          user_email:clientEmail,
          isEmployee: false,
        },})
     // Fetch clients and associated PDFs and lab reports
     const clients = await users.findAndCountAll({
      where: {
        user_email:clientEmail,
        isEmployee: false,
      },
      include: [
        {
          model: pdf_email,
          as: "pdfs",
          where: {
            createdAt: {
              [Op.between]: [new Date(startDate), new Date(endDate)]
            }
          },
          include: [
            {
              model: lab_report,
              as: "labReports",
            },
          ],
        },
      ],
      distinct: true,
    });
    console.log("Clients",clients)
    // return res.status(200).send(clients)
      if (!client) {
        return res.status(404).send({ message: "Client not found" });
      }

      // Fetch all employees invited by this client
      const employees = await users.findAll({
        where: {
          invitedBy: clientEmail,
          isEmployee: true,
            createdAt: {
              [Op.between]: [new Date(startDate), new Date(endDate)]
            }
        }
      });
      console.log("client",client)
      // Fetch all PDFs for this client
      const pdfs = await pdf_email.findAll({
        where: {
          userEmailFk: client.dataValues.id,
          createdAt: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      });

      // Extract IDs from pdfEmails
      const pdfEmailIds = pdfs.map(pdf => pdf.id);

      // Fetch signed and printed PDFs based on those IDs
      const signedPdfsForClient = await signedPdfs.findAll({
        where: {
          email_to: clientEmail,
          isSigned: true , // Ensure to only fetch PDFs that are signed
          createdAt: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      });
      const printedPdfsForClient = await printedPdfs.findAll({
        where: {
          email_to: clientEmail,
          isPrinted: true, // Ensure to only fetch PDFs that are printed
          createdAt: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      });

      // Calculate the total file size for all PDFs
      const totalFileSizeInKB = pdfs.reduce((total, pdf) => total + (pdf.fileSize || 0), 0);

      // Helper function to format file sizes
      function formatFileSize(sizeInKB) {
        if (sizeInKB > 1000) {
          const sizeInMB = (sizeInKB / 1000).toFixed(2);
          return `${sizeInMB} MB`;
        }
        return `${sizeInKB.toFixed(2)} KB`;
      }
    // Accessing the pdfs array safely
    const clientPdfs = clients.rows && clients.rows.length > 0 && clients.rows[0].pdfs ? clients.rows[0].pdfs : [];
      console.log("deployed")
    console.log("clientPdfs", clientPdfs); // This should now safely log the pdfs or an empty array.
      const formattedClient = {
        clientInfo: client,
        employeeCount: employees.length,
        totalPdfsCount: pdfs.length,
        signedPdfsCount: signedPdfsForClient.length,
        printedPdfsCount: printedPdfsForClient.length,
        totalFileSize: formatFileSize(totalFileSizeInKB),
        employees: employees,
        pdfs:clientPdfs.map((pdf) => {
          return pdf.labReports.length > 0
            ? pdf.labReports.map((labReport) => ({
                pdfId: pdf.id,
                emailTo: pdf.email_to,
                receivedAt: pdf.receivedAt,
                pdfPath: pdf.pdfPath,
                isSigned: pdf.isSigned,
                pdfCreatedAt: pdf.createdAt,
                pdfUpdatedAt: pdf.updatedAt,
                fileSize: formatFileSize(pdf.fileSize || 0), // Format the file size
                labReportId: labReport.id,
                protocolId: labReport.protocolId,
                investigator: labReport.investigator,
                subjectId: labReport.subjectId,
                dateOfCollection: labReport.dateOfCollection,
                timePoint: labReport.timePoint,
                timeOfCollection: labReport.time_of_collection,
                labReportCreatedAt: labReport.createdAt,
              }))
            : [
                {
                  pdfId: pdf.id,
                  emailTo: pdf.email_to,
                  receivedAt: pdf.receivedAt,
                  pdfPath: pdf.pdfPath,
                  isSigned: pdf.isSigned,
                  pdfCreatedAt: pdf.createdAt,
                  pdfUpdatedAt: pdf.updatedAt,
                  fileSize: formatFileSize(pdf.fileSize || 0), // Format the file size
                },
              ];
        }).flat(),
        signedPdfsDetails: signedPdfsForClient,
        printedPdfsDetails: printedPdfsForClient
      };

      // Return the response
      return res.status(200).send(formattedClient);
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({ message: "Internal server error", error });
    }
  });
});
exports.getClients = onRequest(async(req,res)=>{
  cors(req,res,async()=>{
    try {
      const clients = await users.findAll({
        where:{
          isEmployee:false,
          isArchived:false
        }
      })
      return res.status(201).send({Clietns: clients})
    } catch (error) {
      console.error("Error fetching signed and printed PDFs:", error);
      return res.status(500).send({
        message: "Internal server error",
        error,
      });
    }
  })
})


exports.getPdfCounts = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOf30Days = new Date(today.setDate(today.getDate() - 30));
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      // Query to get counts
      const todayCount = await pdf_email.count({
        where: {
          receivedAt: {
            [Op.gte]: startOfDay,
          },
        },
      });

      const last30DaysCount = await pdf_email.count({
        where: {
          receivedAt: {
            [Op.gte]: startOf30Days,
          },
        },
      });

      const lastMonthCount = await pdf_email.count({
        where: {
          receivedAt: {
            [Op.gte]: startOfLastMonth,
            [Op.lte]: endOfLastMonth,
          },
        },
      });

      const yearlyCount = await pdf_email.count({
        where: {
          receivedAt: {
            [Op.gte]: startOfYear,
          },
        },
      });

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      // Response structure
         // Response structure
         const response = {
          today: {
            date: formatDate(startOfDay),
            count: todayCount,
          },
          last30Days: {
            startDate: formatDate(startOf30Days),
            count: last30DaysCount,
          },
          lastMonth: {
            startDate: formatDate(startOfLastMonth),
            endDate: formatDate(endOfLastMonth),
            count: lastMonthCount,
          },
          year: {
            startDate: formatDate(startOfYear),
            count: yearlyCount,
          },
        };

      return res.status(200).send(response);
    } catch (error) {
      console.error("Error fetching PDF counts:", error);
      return res.status(500).send({
        message: "Internal server error",
        error,
      });
    }
  });
});
async function getFileSizeInKB(bucketName, fileName) {
  try {
      const [metadata] = await storage.bucket(bucketName).file(fileName).getMetadata();
      const sizeInKB = metadata.size / 1024;
      return parseFloat(sizeInKB.toFixed(2)); // Converts size to kilobytes and rounds to two decimals
  } catch (error) {
      console.error(`Error retrieving file size for ${fileName}: ${error.message}`);
      return null;
  }
}

exports.updatePdf = onRequest({
  timeoutSeconds: 3600,
  memory: "1GiB",
},async (req,res)=>{
  try {
    const pdfs = await pdf_email.findAll();
    for (const pdf of pdfs) {
      const sizeInKB = await getFileSizeInKB('gpdata01', pdf.pdfPath); // Use your actual bucket name
      if (sizeInKB !== null) {
          await pdf.update({ fileSize: sizeInKB });
          console.log(`Updated PDF ${pdf.id} size to ${sizeInKB} KB.`);
      } else {
          console.log(`Failed to get file size for PDF ${pdf.id}.`);
      }
    }
} catch (error) {
    console.error(`Error updating PDF sizes: ${error.message}`);
}
})

exports.downloadDb = onRequest(async(req,res)=>{
  cors(req,res,async()=>{
    try {
      // Fetch data from all models
      const tables = [
          { model: admin, name: 'Admin' },
          { model: users, name: 'Users' },
          { model: pdf_email, name: 'PDF Emails' },
          { model: ref_range_data, name: 'Reference Range Data' },
          { model: lab_report, name: 'Lab Reports' },
          { model: labreport_data, name: 'Lab Report Data' },
          { model: signedPdfs, name: 'Signed PDFs' },
          { model: printedPdfs, name: 'Printed PDFs' },
      ];

      let csvContent = '';

      for (const { model, name } of tables) {
          const data = await model.findAll({ raw: true });
          if (data.length > 0) {
              // Include a table name header
              csvContent += `Table Name: ${name}\r\n`;

              // Convert data to CSV format
              const parser = new Parser({ header: true, fields: Object.keys(data[0]) });
              const csv = parser.parse(data);
              csvContent += csv + '\r\n\r\n'; // Add extra lines between tables
          }
      }

      // Set headers to prompt download
      res.header('Content-Type', 'text/csv');
      res.attachment('full-database.csv');
      res.send(csvContent);
  } catch (error) {
      console.error('Failed to download database:', error);
      res.status(500).send('Error in downloading the CSV file');
  }
  })
})

exports.signPdfTest = onRequest({
  timeoutSeconds: 3600, // Set the function timeout to 1 hour
}, async (req, res) => {
  cors(req, res, async () => {
  

    try {


      const { pdfUrl ,coordinates  } = req.body; // Use a URL in the request body
      console.log("coordinates", coordinates);
      const dateCoords = coordinates.date_coordinates;
      const signCoords = coordinates.signature_coordinates;
      const commentCoords = coordinates.comments_coordinates

      const parts = pdfUrl.split('/');
      const pdfName = parts[parts.length - 1];

      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const pdfBuffer = response.data;
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();

      const fields = [];

     // Assuming pageCount and userDecode are defined elsewhere in your code
     for (let i = 1; i <= pageCount; i++) {
      // Fetch coordinates for the current page
      const pageCoordinates = coordinates[`page_${i}`];
      
      pageCoordinates.forEach(coord => {
        console.log("coorde",coord)
        if (coord.signature_coordinates) {
          const signCoords = coord.signature_coordinates;
          const dateCoords = coord.date_coordinates;
          const commentCoords = coord.comments_coordinates;
    
          // Push fields for signature, date, and comments if they exist
          fields.push(
            {
              type: 'signature',
              required: true,
              fixed_width: false,
              x: signCoords[0], // X coordinate for signature
              y: signCoords[1], // Y coordinate for signature
              page: i,
              recipient_id: 1
            },
            {
              type: 'date',
              required: true,
              fixed_width: false,
              lock_sign_date: true, // Locks the date to auto-populate
              x: dateCoords[0], // X coordinate for date
              y: dateCoords[1], // Y coordinate for date
              page: i,
              recipient_id: 1,
              date_format: 'MM/DD/YYYY'
            }
          );
    
          // Check if comments_coordinates exists and add a text field
          if (commentCoords) {
            fields.push(
              {
                type: 'text',
                required: false,
                fixed_width: false,
                x: commentCoords[0], // X coordinate for comments
                y: commentCoords[1], // Y coordinate for comments
                page: i,
                recipient_id: 1,
              }
            );
          }
        }else {
          // For all other coordinates (non-signature, date, or comments), add them as text fields
          fields.push({
            type: 'text',
            required: false,
            fixed_width: false,
            x: coord[0], // X coordinate
            y: coord[1], // Y coordinate
            page: i,
            recipient_id: 1
          });
        }
      });
    }
    

      // Add additional fields based on specific coordinates for each page
      // Object.keys(coordinates).forEach((pageKey) => {
      //   if (pageKey.startsWith('page')) {
      //     console.log("pagw",pageKey)
      //     const pageNumber = parseInt(pageKey.split('_')[1]); // Extract page number from key
      //     console.log("no",pageNumber)
      //     const pageCoordinates = coordinates[pageKey];

      //     // Loop through each coordinate on the current page to create custom fields
      //     pageCoordinates.forEach(coord => {
      //       fields.push({
      //         type: 'text',
      //         required: false,
      //         fixed_width: false,
      //         x: coord[0], // Multiply X coordinate
      //         y: coord[1] , // Multiply Y coordinate
      //         page: pageNumber,
      //         recipient_id: userDecode.user_id
      //       });
      //     });
      //   }
      // });


      console.log(`The PDF has ${pageCount} pages.`);
      console.log("Fields for signing", fields);

      signwell.auth('YWNjZXNzOjFhMTFjMzhkY2RkNDZhMWZlNDZkNDIyNGM5ODM1NTBj');
      const signUrl = await signwell.postApiV1Documents({
        test_mode: true,
        draft: false,
        with_signature_page: false,
        reminders: true,
        apply_signing_order: false,
        embedded_signing: false,
        embedded_signing_notifications: false,
        text_tags: false,
        allow_decline: true,
        allow_reassign: true,
        files: [
          {
            name: pdfName,
            file_url: pdfUrl
          }
        ],
        recipients: [
          {
            send_email: false,
            send_email_delay: 0,
            id: 1,
            email: "codistan@gmail.com"
          }
        ],
        fields: [fields]
      });

      return res.status(200).send(`Document processed successfully ${JSON.stringify(signUrl)}`);
    } catch (err) {
      if (err === 'Forbidden') {
        return res.sendStatus(403); // Forbidden status if JWT verification fails
      }
      if (err.response) {
        console.error('Invalid keys:', err);
        console.error('Error message:', err);
        return res.status(400).send(err.response.data);
      } else {
        console.error('Error:', err);
        return res.status(500).send("Internal server error", err);
      }
    }
  });
});




