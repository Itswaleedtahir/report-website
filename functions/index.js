const { exec } = require('child_process');
const { onRequest } = require("firebase-functions/v2/https");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const cors = require("cors")({ origin: true });
const sgMail = require('@sendgrid/mail');
const { Op, Sequelize } = require("sequelize");
const { UplaodFile, PdfEmail, labReport, labReoprtData, MakeCsv ,pdfProcessor} = require("./helper/GpData");
const { users, admin, pdf_email, labreport_data, lab_report, labreport_csv, ref_range_data } = require("./models/index");
const fs = require('fs');
const path = require('path');
const os = require('os');

sgMail.setApiKey('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');


exports.SendGridEmailListener = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Convert the buffer to a UTF-8 string
    const bufferDataString = req.body.toString('utf8');
    // Split the email data assuming it's multipart
    let parts = bufferDataString.split("--xYzZY");
    console.log("parts",parts)
    // Initialize variables to store extracted data
    let toAddress = "";
    let fromAddress = "";
    let DateReceivedEmail = "";
    let attachments = [];
    // Regular expressions to match 'To' and 'From' addresses
    const toPattern = /To: (.*)\r\n/;
    const fromPattern = /From: (.*)\r\n/;
    const DatePattern = /Date: (.*)\r\n/;
    // Regex pattern for extracting attachment headers
        const attachmentHeaderPattern = /Content-Type: application\/pdf;\s*name="([^"]+)"\r\nContent-Disposition: attachment;\s*filename="([^"]+)"\r\nContent-Transfer-Encoding: (\S+)\r\nContent-ID: <([^>]+)>\r\nX-Attachment-Id: (\S+)\r\n\r\n/;

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
    // Extract attachment details and base64 encoded content
    parts.forEach(part => {
      const headerEndIndex = part.indexOf('X-Attachment-Id:') + 'X-Attachment-Id:'.length;
      const base64StartIndex = part.indexOf('\r\n\r\n', headerEndIndex) + 4; // Start after the next CRLF pair
      if (headerEndIndex > -1 && base64StartIndex > -1) {
        const headers = part.substring(0, base64StartIndex).match(attachmentHeaderPattern);
        if (headers) {
          const [, name, filename, encoding, contentID, attachmentID] = headers;
          const base64Content = part.substring(base64StartIndex).trim(); // The rest is assumed to be base64 content
          attachments.push({
            name,
            filename,
            encoding,
            contentID,
            attachmentID,
            base64Content
          });
        }
      }
    });
    // Prepare response or further processing
    let response = {
      to: toAddress,
      from: fromAddress,
      DateReceivedEmail: DateReceivedEmail,
      attachments: attachments
    };
    const pdfBufferContent=attachments[0].base64Content;
    const pdfBuffer = Buffer.from(pdfBufferContent,'base64')
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
     console.log("Date,",DateReceivedEmail)
     console.log("path",pdfPath)

     const apiUrl = 'https://d5a9-119-155-140-10.ngrok-free.app/process-pdf/'; // Your API endpoint
  
   const {data} =await pdfProcessor(pdfPath, apiUrl)
    // const extractedDataFormatted =  JSON.parse(data)
    console.log("foramt",data)
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
          tests: tests
        };
      };
      
      const extractedData = extractData(data);

      // Call function to upload file and get necessary data
      const { pdfname, destination } = await UplaodFile(pdfPath, extractedData);
      const pdfURL = `${process.env.STORAGE_URL}${destination}`;
      console.log("URL: ", pdfURL);
      const { pdfEmailId } = await PdfEmail(DateReceivedEmail, pdfname, destination, toAddress);

      const { labReportId } = await labReport(extractedData, pdfEmailId, toAddress);

      // Use extracted test data for lab report entries
      const labdata = extractedData.tests;
      console.log("data", labdata)
      const labreportEntry = await labReoprtData(labdata, labReportId);
      const status = "sent";
      const csv = await MakeCsv(labReportId, extractedData);
      console.log("CSV: ", csv);
      return res.status(200).send({ message: "Process completed" });
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).send("Error processing request.");
    }
  })
});

exports.runMigrations = onRequest((req, res) => {
  exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Migration failed: ${stderr}`);
    } else {
      res.status(200).send(`Migration successful: ${stdout}`);
    }
  });
});

exports.searchLabReports = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { searchTerm } = req.body;

      if (!searchTerm) {
        return res.status(400).send("searchTerm is not defined");
      }

      // Build the search query to match the searchTerm in investigator, protocolId, or subjectId
      const searchCriteria = {
        [Op.or]: [
          { investigator: { [Op.like]: `%${searchTerm}%` } },
          { protocolId: { [Op.like]: `%${searchTerm}%` } },
          { subjectId: { [Op.like]: `%${searchTerm}%` } }
        ]
      };
      // Query the lab_report table
      const labReports = await lab_report.findAll({ where: searchCriteria });

      if (labReports.length === 0) {
        return res.status(404).send("No lab reports found.");
      }

      // Fetch corresponding CSV reports for each lab report
      const labReportsWithCsv = await Promise.all(labReports.map(async (labReport) => {
        const labReportCsv = await labreport_csv.findOne({ where: { labReoprtFk: labReport.id } });
        console.log("csv", labReportCsv)
        return {
          labReport,
          csvContent: labReportCsv ? labReportCsv : null
        };
      }));

      // Return the array of lab reports with their corresponding CSV data
      return res.status(200).json(labReportsWithCsv);
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).send("Error processing request.");
    }
  })
});


exports.searchLabReportsByFilters = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { protocolId, subjectId } = req.body;
      const authHeader = req.headers['authorization'];
      console.log("header", authHeader)
      const token = authHeader
      let userDecode;
      if (!token) {
        return res.sendStatus(401); // Unauthorized
      }

      jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) {
          return res.sendStatus(403); // Forbidden
        }

        userDecode = user;
      })
      const email_to = userDecode.email; // Extracted email from the token

      if (!protocolId && !subjectId) {
        return res.status(400).send("search parameters are required:protocolId, subjectId.");
      }

      // Query the lab_report table
      const labReports = await lab_report.findAll({
        where: {
          protocolId,
          email_to,
          subjectId
        }
      });

      if (labReports.length === 0) {
        return res.status(404).send("No lab reports found.");
      }

      // Fetch corresponding CSV reports for each lab report
      const labReportsWithCsv = await Promise.all(labReports.map(async (labReport) => {
        const labReportCsv = await labreport_csv.findOne({ where: { labReoprtFk: labReport.id } });
        return {
          labReport,
          csvContent: labReportCsv
        };
      }));

      // Return the array of lab reports with their corresponding CSV data
      return res.status(200).json(labReportsWithCsv);
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).send("Error processing request.");
    }
  })
});

exports.getAllLabReportCsv = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Fetch all records from the labreport_csv table
      const labReportCsvs = await labreport_csv.findAll();

      // Return the data as a JSON response
      return res.status(200).json(labReportCsvs);
    } catch (error) {
      console.error("Error fetching lab report CSV data:", error);
      return res.status(500).send("Error fetching lab report CSV data.");
    }
  })
});

exports.addAdmin = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const { user_email, password } = req.body;

    try {
      // Check if the user already exists
      const existingUser = await admin.findOne({ where: { user_email } });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const newUser = await admin.create({ user_email, password: hashedPassword });

      res.status(201).json({ message: "Admin user created successfully", user: newUser });
    } catch (error) {
      console.error("Error during admin creation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
})

exports.adminLogin = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const { user_email, password } = req.body;

    try {
      // Find the user by email
      const user = await admin.findOne({ where: { user_email } });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare the provided password with the stored hash
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: user.id, email: user.user_email }, "your_secret_key", { expiresIn: "1d" });

      res.json({ message: "Login successful", token });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
})

exports.clientInvite = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { clientEmail } = req.body;
      if (!clientEmail) {
        return res.status(400).send('Client email is required.');
      }
      const existingUser = await users.findOne({ where: { user_email: clientEmail } });
      if (existingUser) {
        return res.status(400).json({ message: "Invitation link already sent" });
      }

      const token = uuidv4();
      const invitationUrl = `http://gpdataservices.com/invite/${token}`;

      // Store the token and email in the database for later verification
      await users.create({ user_email: clientEmail, token });

      // Send the email
      const msg = {
        to: clientEmail,
        from: 'haseebpti27@gmail.com', // Replace with your verified sender email
        subject: 'Invitation to Set Your Password',
        text: `Please click the following link to set your password: ${invitationUrl}`,
        html: `<p>Please click the following link to set your password: <a href="${invitationUrl}">${invitationUrl}</a></p>`,
      };

      await sgMail.send(msg);
      console.log('Invitation email sent successfully', msg);
      return res.status(200).send('Invitation email sent successfully');
    } catch (error) {
      console.error('Error sending invitation email:', error.response ? error.response.body : error.message);
      return res.status(400).send({ error: error.message });
    }
  })
});

exports.updatePassword = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).send('Token and password are required.');
      }

      const client = await users.findOne({ where: { token } });

      if (!client) {
        return res.status(400).send('Invalid token.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Update client's password and clear the token
      await users.update({ password: hashedPassword, token: null }, { where: { token } });

      return res.status(200).send('Password updated successfully.');
    } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).send('Error updating password.');
    }
  })
});

exports.clientLogin = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const { user_email, password } = req.body;

    try {
      // Find the user by email
      const user = await users.findOne({ where: { user_email } });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare the provided password with the stored hash
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: user.id, email: user.user_email }, "your_secret_key", { expiresIn: "1d" });

      res.json({ message: "Login successful", token });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
})

exports.getClientReports = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader)
    const token = authHeader
    let userDecode;
    if (!token) {
      return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, 'your_secret_key', (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }

      userDecode = user;
    })

    const email_to = userDecode.email; // Extracted email from the token

    try {
      // Query the lab_report table
      const labReports = await lab_report.findAll({ where: { email_to } });

      if (labReports.length === 0) {
        return res.status(404).send("No lab reports found.");
      }

      // Fetch corresponding CSV reports for each lab report
      const labReportsWithCsv = await Promise.all(labReports.map(async (labReport) => {
        const labReportCsv = await labreport_csv.findOne({ where: { labReoprtFk: labReport.id } });
        return {
          labReport,
          csvContent: labReportCsv
        };
      }));


      return res.json(labReportsWithCsv);
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ message: 'Internal server error', error });
    }
  })

})

exports.getProtocolIds = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const authHeader = req.headers['authorization'];
      console.log("header", authHeader)
      const token = authHeader
      let userDecode;
      if (!token) {
        return res.sendStatus(401); // Unauthorized
      }

      jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) {
          return res.sendStatus(403); // Forbidden
        }

        userDecode = user;
      })

      const email_to = userDecode.email; // Extracted email from the token

      const labReports = await lab_report.findAll({
        where: { email_to },
        attributes: [
          [Sequelize.fn('DISTINCT', Sequelize.col('protocolId')), 'protocolId']
        ],
        raw: true
      });

      return res.status(200).send(labReports)
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ message: 'Internal server error', error });
    }

  })
})

exports.getSubjectIds = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const authHeader = req.headers['authorization'];
      console.log("header", authHeader)
      const token = authHeader
      let userDecode;
      if (!token) {
        return res.sendStatus(401); // Unauthorized
      }

      jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) {
          return res.sendStatus(403); // Forbidden
        }

        userDecode = user;
      })

      const email_to = userDecode.email; // Extracted email from the token
      const { protocolId } = req.body

      const labReports = await lab_report.findAll({
        where: {
          protocolId,
          email_to
        },
        attributes: [
          [Sequelize.fn('DISTINCT', Sequelize.col('subjectId')), 'subjectId']
        ],
        raw: true
      });

      return res.status(200).send(labReports)
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ message: 'Internal server error', error });
    }

  })
})

exports.getInvitedClients = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Fetch all records from the users table
      const invitedUsers = await users.findAll();

      // Return the data as a JSON response
      return res.status(200).json(invitedUsers);
    } catch (error) {
      console.error("Error fetching users data:", error);
      return res.status(500).send("Error fetching users data.");
    }
  })
})