const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');
require('dotenv').config();

// Set up nodemailer transport using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function generatePDF(formData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText(`Name: ${formData.userName}\nGrade: ${formData.grade}\nAnswers: ${JSON.stringify(formData.answers, null, 2)}`, {
        x: 50,
        y: page.getHeight() - 100,
        size: 12,
    });
    return pdfDoc.save();
}

async function sendEmail(pdfBytes, formData) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // You would replace this with the recipient's email
        subject: 'Your Quiz Submission',
        text: 'Please find attached your quiz submission.',
        attachments: [
            {
                filename: 'submission.pdf',
                content: pdfBytes,
                contentType: 'application/pdf'
            }
        ]
    };

    return transporter.sendMail(mailOptions);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const formData = req.body;
        const pdfBytes = await generatePDF(formData);

        await sendEmail(pdfBytes, formData);

        res.status(200).json({ message: 'Quiz submitted and email sent.' });
    } catch (error) {
        console.error('Error processing quiz submission:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
