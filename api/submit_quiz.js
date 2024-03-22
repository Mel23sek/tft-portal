require('dotenv').config();
const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');
const { sql } = require('@vercel/postgres');

// Set up nodemailer transporter with the provided Mailtrap credentials
const transporter = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",
    port: 587,
    auth: {
        user: "api",
        pass: "d77630d7e5b4a8b1f81dc9c6354b7028" // Your Mailtrap password
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
        from: 'tftquizportal@gmail.com', // Replace with your "from" email address
        to: 'tftquizportal@gmail.com', // The recipient's email address
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

        // Ensure that the `sql` function is properly set up for secure parameterized queries
        const result = await sql`
            INSERT INTO quiz_results (user_id, answers)
            VALUES (${formData.userId}, ${JSON.stringify(formData.answers)})
            RETURNING *;
        `;

        await sendEmail(pdfBytes, formData);

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
