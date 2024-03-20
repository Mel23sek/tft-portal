const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log(process.env.EMAIL_USER); // This should log your email username.
console.log(process.env.EMAIL_PASS); // This should log your email password.

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Use body-parser middleware to parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up nodemailer transport using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Handle POST requests to /submit-quiz
app.post('/submit-quiz', (req, res) => {
    // Destructure and get data from request body
    const { userName, gradeLevel, answers } = req.body;
    
    // Directory where PDFs will be stored
    const pdfsDir = path.join(__dirname, 'pdfs');
    
    // Create pdfs directory if it doesn't exist
    if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
    }
    
    // Define the document name and path
    const docName = `Quiz_${userName.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    const docPath = path.join(pdfsDir, docName);

    // Create a new PDF document
    const doc = new PDFDocument();
    const stream = doc.pipe(fs.createWriteStream(docPath));

    // Add content to the PDF
    doc.fontSize(35).text('Quiz Results', { underline: true }).moveDown();
    doc.fontSize(25).text(`Name: ${userName}`).moveDown();
    doc.text(`Grade Level: ${gradeLevel}`).moveDown();
    answers.forEach((answer, index) => {
        doc.text(`Q${index + 1}: ${answer}`).moveDown();
    });

    // Finalize the PDF file
    doc.end();

    // Listen for the 'finish' event to send the email
    stream.on('finish', () => {
        // Function to send the email
        sendEmail(docName, docPath, userName).then(() => {
            // Delete the PDF after sending the email
            fs.unlink(docPath, (err) => {
                if (err) {
                    console.error('Failed to delete PDF:', err);
                    return res.status(500).json({ error: 'Failed to delete PDF after email was sent.' });
                }
                res.json({ message: 'Quiz submitted and email sent successfully' });
            });
        }).catch(error => {
            console.error('Failed to send email:', error);
            res.status(500).json({ error: 'Failed to send email' });
        });
    });
});

// Function to send email with nodemailer
async function sendEmail(docName, docPath, userName) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Could be changed to recipient's email
        subject: `Quiz Submission from ${userName}`,
        text: `A quiz has been submitted by ${userName}. Please find the attached PDF.`,
        attachments: [{ filename: docName, path: docPath }]
    };

    // Send the email and return the promise
    return transporter.sendMail(mailOptions);
}

// Serve the index.html file for the root route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
