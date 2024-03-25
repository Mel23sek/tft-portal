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
async function generatePDF(formData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const fontSize = 12;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const margin = 20;
  let posY = pageHeight - 100; // Starting Y position from top

  // Define maximum width for text based on page size and margins
  const maxWidth = pageWidth - 2 * margin;

  // Add the user name and grade level first
  page.drawText(`Name: ${formData.userName}`, { x: margin, y: posY, size: fontSize });
  posY -= fontSize * 2; // Move down the position for the next text
  page.drawText(`Grade: ${formData.gradeLevel}`, { x: margin, y: posY, size: fontSize });
  posY -= fontSize * 2;

  // Split answers into chunks of 10 words for wrapping
  for (const [question, answer] of Object.entries(formData.answers)) {
    const words = answer.split(' ');
    let line = '';
    let wordCount = 0;

    words.forEach(word => {
      line += `${word} `;
      wordCount++;

      // After 10 words or end of the words array, draw the text and reset the line
      if (wordCount >= 10 || word === words[words.length - 1]) {
        page.drawText(line.trim(), { x: margin, y: posY, size: fontSize, maxWidth: maxWidth });
        line = '';
        wordCount = 0;
        posY -= fontSize * 1.5; // Adjust for line height

        // Add a new page if necessary
        if (posY < margin) {
          page = pdfDoc.addPage();
          posY = pageHeight - margin;
        }
      }
    });
  }

  // Save and return the PDF bytes
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
