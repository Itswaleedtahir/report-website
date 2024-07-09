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

     const AccessCheck = await users.findOne({where:{user_email:toAddress}})
     console.log("Access",AccessCheck.dataValues.access)
     if(AccessCheck.dataValues.access === 'Resume'){
     
     const apiUrl = 'http://gpdataservices.com/process-pdf/'; // Your API endpoint
  
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
          timeOfCollection: data.find(item => item.type === "Time_of_Collecton")?.mentionText || 'Unknown',
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
    }else if(AccessCheck.dataValues.access === 'Paused'){
      return res.status(401).send({message:"User access is paused"})
    }else{
      return res.status(404).send({message:"not found"})
    }
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).send("Error processing request.");
    }
  })
});

// exports.SendGridEmailListeneTestingr = onRequest(async (req, res) => {
//   cors(req, res, async () => {
//     try {
//       const bufferDataString = req.rawBody.toString('utf8');
//       const boundary = bufferDataString.match(/boundary="?(.+?)"?(?:$|;)/)[1];
//       let parts = bufferDataString.split("--" + boundary).map(part => part.trim()).filter(part => part);

//       let attachments = [];

//       parts.forEach((part, index) => {
//         if (part.includes('Content-Type: application/pdf')) {
//           const filenameMatch = part.match(/filename="([^"]+)"/);
//           const filename = filenameMatch ? filenameMatch[1] : `Attachment_${index}.pdf`;

//           const contentStart = part.indexOf('\r\n\r\n') + 4;
//           const contentEnd = part.lastIndexOf('\r\n');
//           if (contentStart !== -1 && contentEnd !== -1) {
//             const pdfContent = part.substring(contentStart, contentEnd);
//             const pdfBuffer = Buffer.from(pdfContent.trim(), 'base64'); // Assumes base64, check if this is necessary

//             const filePath = path.join(__dirname, 'uploads', filename);
//             fs.mkdirSync(path.dirname(filePath), { recursive: true });
//             fs.writeFileSync(filePath, pdfBuffer);
//             attachments.push({ filename, filePath });
//           }
//         }
//       });

//       console.log("Attachments processed:", attachments);
//       res.status(200).send({ message: "PDFs processed and uploaded successfully", attachments });
//     } catch (error) {
//       console.error("Error processing request:", error);
//       res.status(500).send("Error processing request.");
//     }
//   });
// });

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
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);
    if (!authHeader) {
      return res.sendStatus(401); // Unauthorized
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

      const email_to = userDecode.email;
      const { protocolId, subjectId, lab_name } = req.body;
      let labNameArray = lab_name ? JSON.parse(lab_name) : [];

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      // Construct where conditions for lab_report
      const whereConditions = { email_to };
      if (protocolId) whereConditions.protocolId = protocolId;
      if (subjectId) whereConditions.subjectId = subjectId;

      let labReports = [];

      if (labNameArray.length > 0) {
        // Fetch lab reports filtered by lab names if provided
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
                model: ref_range_data, // Make sure this model is defined in your Sequelize setup
                as: 'refRangeData', // This 'as' must match the alias used in your association setup
                attributes: ['refValue'], // Assuming you only want to retrieve the 'value' from ref_range
                required: false // Set to true if every labreport_data must have a corresponding ref_range entry
            }]
            }]
          });
        }));
        labReports = labReports.flat(); // Flatten the array of lab reports
      } else {
        // Fetch all lab reports and their associated labreport_data without filtering by lab names
        labReports = await lab_report.findAll({
          where: whereConditions,
          include: [{
            model: labreport_data,
            as: 'labreport_data',
            required: false, // Include all labreport_data associated with the reports
            include: [{
              model: ref_range_data, // Make sure this model is defined in your Sequelize setup
              as: 'refRangeData', // This 'as' must match the alias used in your association setup
              attributes: ['refValue'], // Assuming you only want to retrieve the 'value' from ref_range
              required: false // Set to true if every labreport_data must have a corresponding ref_range entry
          }]
          }]
        });
      }

      function transformData(reports) {
        let transformed = [];
        reports.forEach(report => {
            if (report.labreport_data && report.labreport_data.length > 0) {
                report.labreport_data.forEach(data => {
                    // Create a new object combining report and lab data information
                    const combinedData = {
                        ...report.dataValues, // Spread the lab report properties
                        ...data.dataValues, // Spread the lab report data properties
                        labreport_data: undefined // Explicitly remove the labreport_data array
                    };
                    delete combinedData.labreport_data; // Ensure labreport_data key is removed
                    transformed.push(combinedData);
                });
            } else {
                // Handle cases where labreport_data is empty or undefined
                const reportData = { ...report.dataValues };
                delete reportData.labreport_data; // Remove the labreport_data if it's empty
                transformed.push(reportData);
            }
        });
        return transformed;
    }

const transformedReports = transformData(labReports);

      // Apply pagination to the filtered list
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

exports.getPlotValuesByFilters = onRequest(async(req,res)=>{
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);
    if (!authHeader) {
      return res.sendStatus(401); // Unauthorized
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

      const email_to = userDecode.email;
      const { protocolId, subjectId, lab_name } = req.body;
      let labNameArray = lab_name ? JSON.parse(lab_name) : [];
      let labReports = []
      labReports = await Promise.all(labNameArray.map(async (name) => {
        return await lab_report.findAll({
          where: {protocolId: protocolId, subjectId: subjectId, email_to: email_to},
          include: [{
            model: labreport_data,
            as: 'labreport_data',
            where: { lab_name: name },
            required: true,
          }]
        });
      }));

      // Transform the data to only include specified fields
      const transformedData = labReports.flat().map(report => {
        return report.labreport_data.map(data => ({
          lab_name: data.lab_name,
          time_of_collection: report.time_of_collection,
          value: data.value,
          dateOfCollection:  report.dateOfCollection
        }));
      }).flat();

      return res.status(201).send(transformedData);
    } catch(error) {
      console.log(error);
      return res.status(500).send(error);
    }
  });
});

exports.getLabDataOnTimePoint = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers['authorization'];
    console.log("header", authHeader);
    if (!authHeader) {
      return res.sendStatus(401); // Unauthorized
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

      const email_to = userDecode.email;
      const { timePoint } = req.body;
      
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const reports = await lab_report.findAll({
        where: {timePoint: timePoint, email_to: email_to},
        order: [['createdAt', 'DESC']],
        include: [{
          model: labreport_data,
          as: 'labreport_data',
          required: true,
          include: [{
            model: ref_range_data, // Make sure this model is defined in your Sequelize setup
            as: 'refRangeData', // This 'as' must match the alias used in your association setup
            attributes: ['refValue'], // Assuming you only want to retrieve the 'value' from ref_range
            required: false // Set to true if every labreport_data must have a corresponding ref_range entry
        }]
        }]
        
      });

      function transformData(reports) {
        let transformed = [];
        reports.forEach(report => {
            if (report.labreport_data && report.labreport_data.length > 0) {
                report.labreport_data.forEach(data => {
                    // Create a new object combining report and lab data information
                    const combinedData = {
                        ...report.dataValues, // Spread the lab report properties
                        ...data.dataValues, // Spread the lab report data properties
                        labreport_data: undefined // Explicitly remove the labreport_data array
                    };
                    delete combinedData.labreport_data; // Ensure labreport_data key is removed
                    transformed.push(combinedData);
                });
            } else {
                // Handle cases where labreport_data is empty or undefined
                const reportData = { ...report.dataValues };
                delete reportData.labreport_data; // Remove the labreport_data if it's empty
                transformed.push(reportData);
            }
        });
        return transformed;
    }

    const transformedReports = transformData(reports);

       // Apply pagination to the filtered list
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
    } catch(error) {
      console.log(error);
      return res.status(500).send(error);
    }
  });
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

exports.getLabReportNamesByEmail = onRequest(async (req, res) => {
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
    if (!email_to) {
      return res.status(400).send("Email parameter is required.");
    }

    try {
      // Fetch lab reports by email
      const labReports = await lab_report.findAll({
        where: { email_to: email_to },
        attributes: ['id'] // Only fetch the 'id' attribute
      });

      if (labReports.length === 0) {
        return res.status(404).send("No lab reports found for the given email.");
      }

      // Extract IDs from the lab reports
      const labReportIds = labReports.map(report => report.id);

      // Fetch unique lab names from labreport_data using the extracted IDs
      const labReportData = await labreport_data.findAll({
        where: { labReoprtFk: labReportIds },
        attributes: ['lab_name'],
        group: ['lab_name'] // Group by 'lab_name' to get unique names
      });

      // Extract lab names from the results
      const labNames = labReportData.map(data => data.lab_name);

      return res.json({
        labNames
      });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).send("Internal server error");
    }
  });
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
    const token = authHeader;
    let userDecode;
    if (!token) {
      return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, 'your_secret_key', (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }

      userDecode = user;
    });

    const email_to = userDecode.email;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    try {
      const labReports = await lab_report.findAll({ where: { email_to },order: [['createdAt', 'DESC']] });

      if (labReports.length === 0) {
        return res.status(404).send("No lab reports found.");
      }

      let allCombinedLabReports = [];
      for (let labReport of labReports) {
        const labReportCsv = await labreport_csv.findOne({ where: { labReoprtFk: labReport.id },order: [['createdAt', 'DESC']] });

        // Fetch all related labReportDatas for the labReport
        const labReportDatas = await labreport_data.findAll(
          {
          where: { labReoprtFk: labReport.id },   
          include: [{
            model: ref_range_data, // Make sure this model is defined in your Sequelize setup
            as: 'refRangeData', // This 'as' must match the alias used in your association setup
            attributes: ['refValue'], // Assuming you only want to retrieve the 'value' from ref_range
            required: false // Set to true if every labreport_data must have a corresponding ref_range entry
        }],order: [['createdAt', 'DESC']]
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
      return res.status(500).json({ message: 'Internal server error', error });
    }
  });
});


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

exports.updateUserAccess = onRequest(async(req,res)=>{
  cors(req,res,async()=>{
    const { email, access } = req.body;

    if (!email || !access) {
      return res.status(400).send({ message: 'Email and access level must be provided.' });
    }
  
    try {
      const user = await users.findOne({ where: { user_email:email } });
      if (!user) {
        return res.status(404).send({ message: 'User not found.' });
      }
  
      user.access = access;
      await user.save();
  
      res.send({ message: 'Access level updated successfully.', user });
    } catch (error) {
      console.error('Error updating user access:', error);
      res.status(500).send({ message: 'Error updating access level.' });
    }
  })
})

exports.getClientByEmail = onRequest(async(req,res)=>{
  cors(req,res,async()=>{
    const {email} = req.body;
    if (!email) {
      return res.status(400).send({ error: 'Email parameter is required.' });
    }

    try {
      const user = await users.findOne({
        where: {
          user_email: email
        }
      });

      if (!user) {
        return res.status(404).send({ error: 'User not found.' });
      }

      res.status(200).send(user);
    } catch (error) {
      console.error('Failed to retrieve user:', error);
      res.status(500).send({ error: 'Failed to retrieve user.' });
    }
  })
})