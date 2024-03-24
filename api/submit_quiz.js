const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');
const { sql } = require('@vercel/postgres');


// Set up nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",
    port: 587,
    auth: {
        user: process.env.MAILTRAP_USER, // Use the environment variable for Mailtrap user
        pass: process.env.MAILTRAP_PASSWORD // Use the environment variable for Mailtrap password
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
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  
    try {
      const formData = req.body;
      const pdfBytes = Buffer.from(formData.pdfBase64.split('base64,')[1], 'base64');
  
      await sendEmail(pdfBytes, formData);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  async function sendEmail(pdfBytes, formData) {
    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD
      }
    });
  
    const mailOptions = {
      from: '"Quiz Portal" <quiz-portal@example.com>',
      to: "recipient@example.com",
      subject: 'Quiz Submission',
      text: 'Please find the quiz submission attached.',
      attachments: [
        {
          filename: 'quiz-results.pdf',
          content: pdfBytes,
          contentType: 'application/pdf'
        }
      ]
    };
  
    await transporter.sendMail(mailOptions);
  }