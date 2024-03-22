const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');
const { sql } = require('@vercel/postgres');

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
        const result = await sql`
      INSERT INTO quiz_results (user_id, answers)
      VALUES (${data.user_id}, ${data.answers})
      RETURNING *;
    `;

    // Respond with the inserted data or a success message.
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    // Send a server error response.
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

