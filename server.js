const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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
    const { userName, gradeLevel, answers } = req.body;
    const pdfsDir = path.join(__dirname, 'pdfs');

    if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
    }

    const docName = `Quiz_${userName.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    const docPath = path.join(pdfsDir, docName);

    const doc = new PDFDocument();
    const stream = doc.pipe(fs.createWriteStream(docPath));
    doc.fontSize(35).text('Quiz Results', { underline: true }).moveDown();
    doc.fontSize(25).text(`Name: ${userName}`).moveDown();
    doc.text(`Grade Level: ${gradeLevel}`).moveDown();
    answers.forEach((answer) => {
        doc.text(`Q${answer.questionNumber}: ${answer.answer}`).moveDown();
    });
    doc.end();

    stream.on('finish', () => {
        sendEmail(docName, docPath, userName).then(() => {
            fs.unlink(docPath, (err) => {
                if (err) {
                    console.error('Failed to delete PDF:', err);
                    res.status(500).json({ error: 'Failed to delete PDF after email was sent.' });
                } else {
                    res.json({ message: 'Quiz submitted and email sent successfully' });
                }
            });
        }).catch(error => {
            console.error('Failed to send email:', error);
            res.status(500).json({ error: 'Failed to send email' });
        });
    });
});

async function sendEmail(docName, docPath, userName) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `Quiz Submission from ${userName}`,
        text: `A quiz has been submitted by ${userName}. Please find the attached PDF.`,
        attachments: [{ filename: docName, path: docPath }]
    };
    return transporter.sendMail(mailOptions);
}

// If no other route matches, serve the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
