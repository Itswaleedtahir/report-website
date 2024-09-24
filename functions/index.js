const { exec } = require('child_process');
const { onRequest } = require("firebase-functions/v2/https");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require("cors")({ origin: true });
const sgMail = require('@sendgrid/mail');
const { Op, Sequelize } = require("sequelize");
const { UplaodFile, PdfEmail, labReport, labReoprtData, MakeCsv, pdfProcessor, findAllLabData, insertOrUpdateLabReport, logoExtraction, UploadFile } = require("./helper/GpData");
const { users, admin, pdf_email, labreport_data, lab_report, labreport_csv, ref_range_data, signedPdfs } = require("./models/index");
const fs = require('fs');
const sequelize = require('./config/db'); // Import the configured instance
const { PDFDocument } = require('pdf-lib');
const signwell = require('@api/signwell');
const path = require('path');
const os = require('os');

sgMail.setApiKey('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');


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
  console.log("pdfs", pdfs)
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

// This function sets up a listener for SendGrid email webhook events and processes PDF attachments.
exports.SendGridEmailListener = onRequest({
  timeoutSeconds: 3600, // Set the function timeout to 1 hour
  memory: "1GiB", // Allocate 1 GiB of memory to the function
  // maxInstances: 10  // Increase max instances as needed
}, async (req, res) => {
  cors(req, res, async () => {
    try {

      // Convert the buffer to a UTF-8 string
      const bufferDataString = req.body.toString('utf8');

      // Split the email data assuming it's multipart
      let parts = bufferDataString.split("--xYzZY");

      console.log("parts", parts)

      // Initialize variables to store extracted data
      let toAddress = "";
      let fromAddress = "";
      let DateReceivedEmail = "";

      // Regular expressions to match 'To' and 'From' addresses
      const toPattern = /To: (.*)\r\n/;
      const fromPattern = /From: (.*)\r\n/;
      const DatePattern = /Date: (.*)\r\n/;

      // Extract 'To' and 'From' addresses
      const toMatch = parts.find(part => toPattern.test(part));
      if (toMatch) {
        toAddress = toMatch.match(toPattern)[1].trim();
      }

      const fromMatch = parts.find(part => fromPattern.test(part));
      if (fromMatch) {
        fromAddress = fromMatch.match(fromPattern)[1].trim();
      }

      const DateReceived = parts.find(part => DatePattern.test(part));
      if (DateReceived) {
        DateReceivedEmail = DateReceived.match(DatePattern)[1].trim();
      }

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

        while ((match = boundaryRegex.exec(email)) !== null) {
          const [, filename, base64Content] = match;
          // Trimming and removing any extra headers before the Base64 content starts
          const cleanBase64 = base64Content.replace(/^[\\r\\n]+/, '').trim();
          attachments.push({
            filename,
            base64Content: cleanBase64
          });
        }

        return attachments;
      }

      let attachments
      if (fromAddress.includes("@outlook.com")) {
        // Regular expression to match email addresses
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;

        // Find all matches in the text
        const toTheSender = toAddress.match(emailRegex);
        toAddress = toTheSender[0]
        console.log("toaddress", toTheSender[0])

        const FromTheSender = fromAddress.match(emailRegex);
        fromAddress = FromTheSender[0]
        console.log("toaddress", FromTheSender[0])


        // Extract PDF base64 strings
        attachments = extractPDFs(bufferDataString);
      } else {
        attachments = extractPDFAttachments(bufferDataString);
      }
      // toAddress = toAddress.replace('client.', '')
      // // Prepare response or further processing
      let response = {
        to: toAddress,
        from: fromAddress,
        DateReceivedEmail: DateReceivedEmail,
        attachments: attachments
      };

      // Process each PDF attachment
      attachments.forEach(async (attachment) => {
        const pdfBuffer = Buffer.from(attachment.base64Content, 'base64');

        // Generate a timestamp-based filename
        const timestamp = new Date().getTime(); // Get current time in milliseconds
        const filename = `output-${timestamp}.pdf`;

        // Define the path to save the PDF
        const uploadsDir = path.join(__dirname, 'uploads');
        const pdfPath = path.join(uploadsDir, filename);

        // Ensure the uploads directory exists
        fs.mkdirSync(uploadsDir, { recursive: true });
        // Write the binary data to a PDF file
        fs.writeFileSync(pdfPath, pdfBuffer);
        // Example: Print the extracted data
        console.log("To:", toAddress);
        console.log("From:", fromAddress);
        console.log("Attachments:", attachments);
        console.log("Date,", DateReceivedEmail)
        console.log("path", pdfPath)
        const AccessCheck = await users.findOne({ where: { user_email: toAddress } })
        console.log("Access", AccessCheck)
        if (AccessCheck.dataValues.access === 'Resume') {

          const apiUrl = 'https://gpdataservices.com/process-pdf/'; // API Endpoint for Google document AI for processing the PDF's
          const logoUrl = 'https://gpdataservices.com/ext-logo/' // API Endpoint for extracting Logo from the pdf's
          const { logo } = await logoExtraction(pdfPath, logoUrl)
          const { data } = await pdfProcessor(pdfPath, apiUrl)

          // Extract and map data from the parsed JSON response
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

              // Find the first refRange with a length less than or equal to 30 characters
              const refRange = properties.filter(prop => prop.type === "Ref_Range")
                .find(prop => prop.mentionText.length <= 30);

              return {
                lab_provider: logo.lab_name || "Medpace",
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

          let extractedData = extractData(data);

          function cleanTestData(data) {

            // Iterate through tests and clean values and refValues
            data.tests.forEach(test => {
              // Remove alphabetic characters from value if not "Pending"
              if (test.value !== "Pending") {
                test.value = test.value.replace(/[a-zA-Z]/g, '').trim();
              }

              // Check refValue length and remove if too long
              if (test.refValue && test.refValue.length > 30) {
                console.log(`Removing long refValue: ${test.refValue}`);
                delete test.refValue; // This will remove the refValue field from the test
              }
            });

            return data;
          }
          extractedData = cleanTestData(extractedData);
          // console.log("cleandddd",cleand)
          // return

          // Call function to upload file and get necessary data
          const { pdfname, destination } = await UplaodFile(pdfPath, extractedData);
          const pdfURL = `${process.env.STORAGE_URL}${destination}`;
          console.log("URL: ", pdfURL);

          //Calling function to dump the data in pdf_email table 
          const { pdfEmailId } = await PdfEmail(DateReceivedEmail, pdfname, destination, toAddress);

          //Checking if data is repeating
          await findAllLabData(extractedData, toAddress,destination)

          //Updating the data if already exist
          const { message, datamade } = await insertOrUpdateLabReport(extractedData, toAddress)
          console.log("message", datamade)
          if (message === 'Add') {
            const test = await findAllLabData(datamade, toAddress,destination)
            const { message } = await insertOrUpdateLabReport(datamade, toAddress)
            console.log("hereeee", message)
            if (message === 'Add') {
              console.log("after update Add")

              //Dumping data into lab_Report table in db
              const { labReportId } = await labReport(datamade, pdfEmailId, toAddress);
              // Use extracted test data for lab report entries
              const labdata = datamade.tests;
              console.log("data", labdata)

              //Dumping data into DB againt labreportdatta table
              const labreportEntry = await labReoprtData(labdata, labReportId);
              const status = "sent";

              //Making csv saving into GDS and adding into DB
              const csv = await MakeCsv(labReportId, datamade);
              console.log("CSV: ", csv);
              console.log("Process completed")
            } else {
              console.log("Data after update already exist")
            }
          } else {
            console.log("Data already exists")
          }
        } else if (AccessCheck.dataValues.access === 'Paused') {
          console.log("User access is paused")
        } else {
          console.log("not found")
        }
      })
      console.log("pdfs are processed")
      return res.status(200).send("PDF's are processed")
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).send("Error processing request.");
    }
  })
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

      const whereConditions = { email_to: { [Sequelize.Op.in]: nonArchivedEmails } };
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

      const pdfResults = await Promise.all(labReports.map(async (report) => {
        return pdf_email.findAll({ where: { id: report.pdfEmailIdfk } });
      }));
      const pdfPathMap = pdfResults.flat().reduce((acc, pdf) => ({
        ...acc,
        [pdf.id]: pdf.dataValues.pdfPath
      }), {});

      function transformData(reports, pdfPathMap) {
        const uniqueReportsMap = new Map();

        reports.forEach(report => {
          if (report.labreport_data && report.labreport_data.length > 0) {
            report.labreport_data.forEach(data => {
              const uniqueKey = `${report.protocolId}-${report.investigator}-${report.subjectId}-${report.dateOfCollection}-${report.timePoint}-${report.email_to}-${report.time_of_collection}-${data.lab_name}`;

              let existingEntry = uniqueReportsMap.get(uniqueKey);
              if (!existingEntry || existingEntry.value === "Pending" && data.value !== "Pending") {
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

      labReports.sort((a, b) => {
        return new Date(b.dataValues.dateOfCollection) - new Date(a.dataValues.dateOfCollection);
      });

      const transformedReports = transformData(labReports, pdfPathMap);
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
    } catch ( error) {
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
          email_to:report.email_to
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
      if(existingInvitation){
      if (existingInvitation.token === null) {
        // If an invitation already exists by this inviter, return a 400 Bad Request status with a message
        return res.status(400).json({ message: `You have already invited ${clientEmail}` });
      }}
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
      }else{
        const newToken = uuidv4();
        await users.create({
          user_email: clientEmail,
          invitedBy: email_to,
          token:newToken,
          expirationDate:expirationDate,
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
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests.
    const { email } = req.body; // Extract the email from the request body.

    // Validate that the email parameter is provided in the request.
    if (!email) {
      // Return a 400 Bad Request status if the email is not provided.
      return res.status(400).send({ error: 'Email parameter is required.' });
    }

    try {
      // Attempt to find the user in the database using the provided email.
      const user = await users.findOne({
        where: {
          user_email: email
        }
      });

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

      // Check if the user was found.
      if (!user) {
        // If no user is found, return a 404 Not Found status.
        return res.status(404).send({ error: 'User not found.' });
      }

      // If the user is found, return the user details with a 200 OK status.
     return res.status(200).send([clientData]);
    } catch (error) {
      // Log the error if there is an issue retrieving the user.
      console.error('Failed to retrieve user:', error);
      // Return a 500 Internal Server Error if an exception occurs during the database query.
      res.status(500).send({ error: 'Failed to retrieve user.' });
    }
  })
});

// This function sets up an HTTP endpoint to retrieve employee details by their email.
// It searches for all users they have invited as well as their own record.
exports.getEmployeeByEmail = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to allow handling of cross-origin requests.
    const { email } = req.body; // Extract the email from the request body.

    // Check if the email parameter is provided.
    if (!email) {
      // Return a 400 Bad Request if the email is missing.
      return res.status(400).send({ error: 'Email parameter is required.' });
    }

    try {
      // Attempt to find all users who were invited by the employee with the given email.
      const usersInvitedBy = await users.findAll({
        where: {
          invitedBy: email,
          isEmployee: true // Ensure that only employees are considered.
        }
      });

      let result;

      if (usersInvitedBy.length > 0) {
        // If any users were invited by the employee, use this list as the result.
        result = usersInvitedBy;
      } else {
        // If no invited users are found, search for the employee themselves by their email.
        const userByEmail = await users.findOne({
          where: {
            user_email: email,
            isEmployee: true
          }
        });

        // Ensure that a single user result is also returned as an array for consistency.
        result = userByEmail ? [userByEmail] : [];
      }

      // If no result is found (neither invited users nor the user themselves), return a 404 Not Found.
      if (result.length === 0) {
        return res.status(404).send({ error: 'User not found.' });
      }

      // Return the found users or user details with a 200 OK status.
      res.status(200).send(result);
    } catch (error) {
      // Log any errors encountered during the retrieval process.
      console.error('Failed to retrieve user:', error);
      // Return a 500 Internal Server Error if there is an exception.
      res.status(500).send({ error: 'Failed to retrieve user.' });
    }
  })
});

// This function sets up an HTTP endpoint to delete an employee from the database based on their email.
exports.deleteEmployee = onRequest(async (req, res) => {
  cors(req, res, async () => { // Enable CORS to handle cross-origin requests.
    try {
      const { email } = req.body; // Extract the email from the request body.

      // Check if the email parameter is provided.
      if (!email) {
        // If the email is not provided, return a 400 Bad Request.
        return res.status(400).send({ message: 'Email parameter is required for deletion.' });
      }

      // Attempt to delete the user from the database who matches the email and is an employee.
      const deleteUserEmail = await users.destroy({
        where: {
          user_email: email,
          isEmployee: true
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
  timeoutSeconds: 3600, // Set the function timeout to 1 hour
  memory: "1GiB", // Allocate 1 GiB of memory to the function
}, async (req, res) => {
  cors(req, res, async () => {
    // Retrieve the authorization header from the request
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader); // Log the authorization header for debugging

    // If no authorization header is found, send a 401 Unauthorized response
    if (!authHeader) {
      return res.sendStatus(401);
    }

    try {
      // Verify the JWT from the authorization header
      const userDecode = await new Promise((resolve, reject) => {
        jwt.verify(authHeader, 'your_secret_key', (err, user) => {
          if (err) {
            reject(new Error('Forbidden')); // Reject the promise if JWT is invalid
          } else {
            resolve(user); // Resolve the promise with the decoded user if JWT is valid
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
      let labReports = [];
      let pdfPath = [];

      await Promise.all(req.body.search.map(async (search) => {
        const valueCondition = {};
        let lab_names = JSON.parse(search.lab_name_json);
        if (search.minValue !== undefined && search.maxValue !== undefined) {
            valueCondition.value = { [Sequelize.Op.between]: [search.minValue, search.maxValue] };
        } else if (search.minValue !== undefined) {
            valueCondition.value = { [Sequelize.Op.gte]: search.minValue };
        } else if (search.maxValue !== undefined) {
            valueCondition.value = { [Sequelize.Op.lte]: search.maxValue };
        }
          const result = await lab_report.findAll({
                where: { email_to: { [Sequelize.Op.in]: nonArchivedEmails } },
                include: [{
                    model: labreport_data,
                    as: 'labreport_data',
                    where: { lab_name: lab_names, ...valueCondition },
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
              if (!existingEntry || existingEntry.value === "Pending" && data.value !== "Pending") {
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
      if (labReports.length === 1) {
        console.log("insideiffff")
        const transformedReports = transformData(labReports, pdfPathMap);
        // If only one record, send it directly
        return res.json({
            data: transformedReports,
            pagination: {
                totalItems: 1,
                totalPages: 1,
                currentPage: 1,
                pageSize: 1
            }
        });
    } else {
      console.log("insdeelseeeeeeeee")
        // More than one record, apply filtering for the same protocolId and subjectId
        const filteredReports = labReports.reduce((acc, report) => {
            const key = `${report.protocolId}-${report.subjectId}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(report);
            return acc;
        }, {});

        const finalReports = Object.values(filteredReports).filter(reports => reports.length > 1).flat();

        const transformedReports = transformData(finalReports, pdfPathMap);
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
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
    }
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
    console.log("header", authHeader);  // Log the received authorization header for debugging
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


exports.signPdf = onRequest(async (req, res) => {
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

      // Determine the appropriate email to filter lab reports based on user role
      let email_to = userDecode.user.isEmployee ? userDecode.user.invitedBy : userDecode.user.user_email;
      if (!email_to) {
        return res.status(400).send("Email parameter is required."); // Check if email is parsed correctly
      }
      const user = await users.findOne({ where: { user_email: email_to } });
      console.log("user", user)
      if (user.dataValues.isArchived == true) {
        // If no user is found with the provided email, return a 404 Not Found status.
        return res.status(400).send({ message: 'User is archived' });
      }
      const { pdfUrl } = req.body; // Use a URL in the request body
      console.log(`PDF URL: ${pdfUrl}`); // Debug the URL
      const parts = pdfUrl.split('/');

      // The PDF name is expected to be the last segment after the last '/'
      const pdfName = parts[parts.length - 1];

      console.log(pdfName);
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const pdfBuffer = response.data;
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      const fields = [];
      for (let i = 1; i <= pageCount; i++) {
        // fields.push({
        //   type: 'signature',
        //   required: true,
        //   fixed_width: false,
        //   lock_sign_date: false,
        //   x: 217,
        //   y: 828,
        //   page: i,
        //   recipient_id: '9'
        // });
        fields.push(
          {
            type: 'signature',
            required: true,
            fixed_width: false,
            lock_sign_date: false,
            x: 217,  // X coordinate for signature
            y: 828,  // Y coordinate for signature
            page: i,
            recipient_id: '9'
          },
          {
            type: 'date',
            required: true,
            fixed_width: false,
            lock_sign_date: false, // Set true if you want the date to auto-populate and lock
            x: 590,  // Adjusted X coordinate for date box
            y: 840,  // Same Y coordinate to align horizontally with signature
            page: i,
            recipient_id: '9',
            date_format: 'MM/DD/YYYY' // Specify the format for the date
          }
        );
      }
      console.log(`The PDF has ${pageCount} pages.`);
      console.log("pagessss", fields)
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
            id: '9',
            email: 'waleedcodistan@gmail.com'
          }
        ],
        fields: [
          fields
        ]
      })
      console.log("signed pdf", signUrl.data.id)
      const signedPdf = await signedPdfs.create({ pdf_id: signUrl.data.id, pdfEmailIdfk: req.body.pdfId })
      return res.status(200).send(`Document processed successfully ${JSON.stringify(signUrl)}`);
    } catch (err) {
      if (err === 'Forbidden') {
        return res.sendStatus(403); // Forbidden status if JWT verification fails
      }
      if (err.response) {
        // Log the invalid keys from the API error response
        console.error('Invalid keys:', err);
        console.error('Error message:', err);
        return res.status(400).send(err.response.data);
      } else {
        // General error handling if the response is not available
        console.error('Error:', err);
        return res.status(500).send("Internal server error",err);
      }// Return Internal Server Error for other cases
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

      // Perform a database query to fetch lab reports matching the specified criteria
      const labReports = await pdf_email.findAll({
        where: {
          email_to: { [Sequelize.Op.in]: nonArchivedEmails },
          isSigned: false
        }
      });

      return res.status(201).send(labReports); // Send the fetched lab reports as a response
    } catch (error) {
      if (error === 'Forbidden') {
        return res.sendStatus(403); // Forbidden status if JWT verification fails
      }
      console.error('Error:', error); // Log any errors for debugging
      return res.status(500).send("Internal server error"); // Return Internal Server Error for other cases
    }
  });
});


exports.getSignedPdf = onRequest(async(req, res) => {
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
      const labReports = await signedPdfs.findAll({
        where: {
          email_to: { [Sequelize.Op.in]: nonArchivedEmails },
          isSigned: true
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


exports.deleteUser = onRequest(async(req,res)=>{
  cors(req,res,async()=>{
    const { id } = req.query;

    try {
      // Start a transaction
    
        const user = await users.findOne({ where: { id }});
        if (!user) {
          throw new Error('User not found');
        }
        const userEmail = user.dataValues.user_email
        console.log("id",userEmail)
        const pdfEmailIds = await pdf_email.findAll({ where: {userEmailFk:id },attributes: ['id'],});
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

        return { deleteData, deleteCsv,deleteLabReport ,deletePdfEmail,invitedUsersDeletion,deleteUser};
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

exports.getEmployeeClients = onRequest(async(req,res)=>{
  cors(req,res,async()=>{
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