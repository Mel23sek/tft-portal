const express = require('express');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5500;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/submit-quiz', (req, res) => {
    console.log('POST request received on /submit-quiz', req.body);
    const { userName, gradeLevel, answers } = req.body;

    if (!userName || !gradeLevel || !Array.isArray(answers)) {
        console.error('Validation Error:', req.body);
        return res.status(400).json({ error: 'Request body must contain userName, gradeLevel, and answers array.' });
    }

    const pdfsDir = path.join(__dirname, 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
    }

    const docName = `Quiz_${userName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const docPath = path.join(pdfsDir, docName);
    const doc = new PDFDocument();
    let stream = doc.pipe(fs.createWriteStream(docPath));
    doc.fontSize(25).text('Quiz Results', { underline: true }).moveDown();
    doc.fontSize(18).text(`Name: ${userName}`).moveDown();
    doc.text(`Grade Level: ${gradeLevel}`).moveDown();
    answers.forEach((answer, index) => {
        doc.text(`Q${index + 1}: ${answer.answer}`).moveDown(); // Ensure that answer is structured correctly
    });
    doc.end();

    stream.on('finish', () => {
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Replace with recipient email address if necessary
            subject: `Quiz Submission from ${userName}`,
            text: `A quiz has been submitted by ${userName}. Please find the attached PDF.`,
            attachments: [{ filename: docName, path: docPath }]
        }, (error, info) => {
            if (error) {
                console.error('Failed to send email:', error);
                fs.unlinkSync(docPath); // Clean up the PDF file
                return res.status(500).json({ error: 'Failed to send email' });
            }
            console.log('Email sent: ' + info.response);
            fs.unlinkSync(docPath); // Clean up the PDF file
            res.json({ message: 'Quiz submitted and email sent successfully' });
        });
    });
});

// Serve index.html for any unknown paths
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
