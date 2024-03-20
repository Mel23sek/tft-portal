const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5500;

// Serve static files from the "public" directory
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
    const { userName, gradeLevel, answers } = req.body;

    // Validate the data
    if (!userName || !gradeLevel || !Array.isArray(answers)) {
        return res.status(400).json({
            error: 'Request body must contain userName, gradeLevel, and answers array.'
        });
    }

    generateAndSendPDF(userName, gradeLevel, answers, res);
});

function generateAndSendPDF(userName, gradeLevel, answers, res) {
    // PDF generation logic
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

    answers.forEach((answer, index) => {
        doc.text(`Q${answer.questionNumber}: ${answer.answer}`).moveDown();
    });

    doc.end();

    stream.on('finish', () => {
        sendEmail(docName, docPath, userName, res);
    });
}

function sendEmail(docName, docPath, userName, res) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `Quiz Submission from ${userName}`,
        text: `A quiz has been submitted by ${userName}. Please find the attached PDF.`,
        attachments: [{ filename: docName, path: docPath }]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Failed to send email:', error);
            fs.unlinkSync(docPath); // Delete the created PDF
            res.status(500).json({ error: 'Failed to send email' });
        } else {
            console.log('Email sent: ' + info.response);
            fs.unlinkSync(docPath); // Delete the created PDF
            res.json({ message: 'Quiz submitted and email sent successfully' });
        }
    });
}

// Catch-all handler for any other GET request not handled above
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
