const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');
const { sql } = require('@vercel/postgres');

require('dotenv').config();

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
    page.drawText(`Name: ${formData.userName}\nGrade: ${formData.gradeLevel}\nAnswers: ${JSON.stringify(formData.answers, null, 2)}`, {
        x: 50,
        y: page.getHeight() - 100,
        size: 12,
    });
    return pdfDoc.save();
}

async function sendEmail(pdfBytes, formData) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Ensure you get the recipient's email from formData
        subject: 'Your Quiz Submission',
        text: 'Please find attached your quiz submission.',
        attachments: [{
            filename: 'submission.pdf',
            content: pdfBytes,
            contentType: 'application/pdf'
        }]
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

        // Insert quiz results into the database
        // Make sure to use parameterized queries to prevent SQL injection
        const result = await sql`
            INSERT INTO quiz_results (user_id, answers)
            VALUES (${formData.userId}, ${JSON.stringify(formData.answers)})
            RETURNING *;
        `;

        // Send an email with the generated PDF
        await sendEmail(pdfBytes, formData);

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
