const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');
const { sql } = require('@vercel/postgres');
require('dotenv').config();

// Configure transporter for nodemailer with Mailtrap using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_SMTP_HOST,
  port: parseInt(process.env.MAILTRAP_SMTP_PORT, 10),
  auth: {
    user: process.env.MAILTRAP_SMTP_USER,
    pass: process.env.MAILTRAP_SMTP_PASS
  }
});


// Function to generate a PDF document from the quiz submission data
async function generatePDF(formData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const text = `Name: ${formData.userName}\nGrade: ${formData.gradeLevel}\nAnswers: ${JSON.stringify(formData.answers, null, 2)}`;
  page.drawText(text, {
    x: 50,
    y: page.getHeight() - 100,
    size: 12,
  });
  return pdfDoc.save();
}

// Function to send an email with the PDF attachment
async function sendEmail(pdfBytes, formData) {
  const mailOptions = {
    from: 'melissa_sekhri@tftportal.com',
    to: process.env.EMAIL_USER, // Email sent to yourself for quiz record
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

  return transporter.sendMail(mailOptions);
}

// Function to save quiz submission data to your database
async function saveSubmissionToDatabase(formData) {
  try {
    const results = await sql`
      INSERT INTO quiz_submissions (username, grade_level, answers)
      VALUES (${formData.userName}, ${formData.gradeLevel}, ${JSON.stringify(formData.answers)})
      RETURNING id;
    `;
    return results[0].id; // Returns the ID of the inserted record
  } catch (error) {
    throw new Error(`Failed to save submission to database: ${error}`);
  }
}

// Main function to handle the POST request
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const formData = req.body;
    const pdfBytes = await generatePDF(formData);
    const emailResult = await sendEmail(pdfBytes, formData);
    const saveResult = await saveSubmissionToDatabase(formData);

    // Return success response
    res.status(200).json({ success: true, emailResult, saveResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
