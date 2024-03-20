const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5500;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/submit-quiz', (req, res) => {
    console.log('Submit Quiz Endpoint Hit: ', req.body); // Log the request body to see incoming data

    const { userName, gradeLevel, answers } = req.body;

    if (!userName || !gradeLevel || !Array.isArray(answers)) {
        console.error('Validation Error: ', req.body); // Log the error for the request
        return res.status(400).json({
            error: 'Request body must contain userName, gradeLevel, and answers array.'
        });
    }

// POST endpoint for '/submit-quiz'
app.post('/submit-quiz', (req, res) => {
    console.log('POST request received on /submit-quiz'); // Log when a request is received
    const { userName, gradeLevel, answers } = req.body;
    
    // Log the request body for debugging
    console.log('Request body:', req.body);

    if (!userName || !gradeLevel || !Array.isArray(answers)) {
        console.error('Validation Error: ', 'Request body must contain userName, gradeLevel, and answers array.');
        return res.status(400).json({ error: 'Request body must contain userName, gradeLevel, and answers array.' });
    }

    const pdfsDir = path.join(__dirname, 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
    }

    const docName = `Quiz_${userName.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    const docPath = path.join(pdfsDir, docName);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(docPath);

    doc.pipe(stream);
    doc.fontSize(25).text('Quiz Results', { underline: true }).moveDown();
    doc.fontSize(18).text(`Name: ${userName}`).moveDown();
    doc.text(`Grade Level: ${gradeLevel}`).moveDown();

    answers.forEach(answer => {
        doc.text(`Q${answer.questionNumber}: ${answer.answer}`).moveDown();
    });

    doc.end();

    stream.on('finish', () => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Add recipient email address here if different
            subject: `Quiz Submission from ${userName}`,
            text: `A quiz has been submitted by ${userName}. Please find the attached PDF.`,
            attachments: [{ filename: docName, path: docPath }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Failed to send email:', error);
                fs.unlinkSync(docPath); // Delete the PDF file
                return res.status(500).json({ error: 'Failed to send email' });
            }

            console.log('Email sent: ' + info.response);
            fs.unlinkSync(docPath); // Delete the PDF file
            res.json({ message: 'Quiz submitted and email sent successfully' });
        });
    });
});

// Catch-all handler for any other GET request not handled above
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


})

