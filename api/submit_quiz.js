const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');
const { sql } = require('@vercel/postgres');
require('dotenv').config();


const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_SMTP_HOST,
  port: parseInt(process.env.MAILTRAP_SMTP_PORT, 10),
  auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS
  }
});

const subJSON = JSON.stringify(transporter) 

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
console.log(generatePDF(formData));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
      const formData = req.body;
      const pdfBytes = await generatePDF(formData); // Ensure this is defined and correctly generates a PDF
      await sendEmail(pdfBytes, formData); // Ensure environment variables match
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
  console.log($(transporter));
  console.log($(mailOptions));

    const mailOptions = {
      from: "tftquizportal@gmail.com",
      to: "tftquizportal@gmail.com",
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