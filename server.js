const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function submitQuiz(gradeLevel, longAnswer) {
    const userName = localStorage.getItem('userName');
    if (!userName) {
        alert('User name is not set. Please make sure you have entered your name.');
        return; // Exit the function if userName isn't set
    }

    // Check if the required fields are provided
    if (!userName || !gradeLevel || !Array.isArray(answers)) {
        return res.status(400).json({
            error: 'Request body must contain userName, gradeLevel, and answers array.'
        });
    }

    const pdfsDir = path.join(__dirname, 'pdfs');

    if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
    }

    const docName = `Quiz_${userName.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    const docPath = path.join(pdfsDir, docName);

    const doc = new PDFDocument();
    const stream = doc.pipe(fs.createWriteStream(docPath));

    doc.fontSize(25).text('Quiz Results', { underline: true }).moveDown();
    doc.fontSize(18).text(`Name: ${userName}`).moveDown();
    doc.text(`Grade Level: ${gradeLevel}`).moveDown();

    answers.forEach((answer, index) => {
        if (answer.questionNumber && answer.answer) {
            doc.text(`Q${index + 1}: ${answer.answer}`).moveDown();
        } else {
            // Handle the error scenario where questionNumber or answer is not provided
            console.error('Invalid answer format:', answer);
            res.status(400).json({ error: 'Each answer must have a questionNumber and an answer.' });
            return;
        }
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

// Catch-all handler to serve the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
}