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
  let page = pdfDoc.addPage();
  const fontSize = 12;
  let posY = page.getHeight() - 50; // Start 50 units from the top of the page
  const posX = 50; // Start 50 units from the left of the page
  const lineSpacing = 10; // Line spacing of 18 units

  // Function to add text with automatic new line after 10 words
  function addTextWithLineBreaks(text, posX, posY, maxWidth) {
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;

    words.forEach((word, index) => {
      line += word + ' ';
      if ((index + 1) % 15 === 0 || index === words.length - 1) { // Break line after every 10 words or on last word
        page.drawText(line.trim(), { x: posX, y: posY - lineCount * lineSpacing, size: fontSize, maxWidth });
        line = ''; // Reset line
        lineCount++; // Increment line count
      }
    });

    return lineCount * lineSpacing; // Return the total height taken by the text
  }

  // Draw name and grade at the top
  page.drawText(`NAME: --- ${formData.userName} ---`, { x: posX, y: posY, size: fontSize });
  posY -= 3 * lineSpacing;
  page.drawText(`GRADE: --- ${formData.gradeLevel} ---`, { x: posX, y: posY, size: fontSize });
  posY -= 3 * lineSpacing; 

  // Iterate over each answer and draw it with the question number
  for (const [question, answer] of Object.entries(formData.answers)) {
    // Add question number
    page.drawText(`QUESTION ${question}:`, { x: posX, y: posY, size: fontSize });
    posY -= lineSpacing; // Move down for the answer

    // Add the answer, handle long answers with line breaks
    const textHeight = addTextWithLineBreaks(answer, posX, posY, page.getWidth() - 2 * posX , 2 * lineSpacing);
    posY -= textHeight + lineSpacing; // Additional space before next question

    // Check if we need a new page
    if (posY < 50) {
      page = pdfDoc.addPage();
      posY = page.getHeight() - 50; // Reset Y position
    }
  }

  // Save and return the generated PDF
  return pdfDoc.save();
}



// Function to send an email with the PDF attachment
async function sendEmail(pdfBytes, formData) {
  const mailOptions = {
    from: 'Mel23sek@tftportal.com',
    to: process.env.EMAIL_USER, // Email sent to yourself for quiz record
    subject: `Quiz Submission from ${formData.userName}`,
    text: `Please find the quiz submission attached from ${formData.userName}`,
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
