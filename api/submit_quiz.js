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
  let posY = page.getHeight() - 50; // Start from the top
  const posX = 50; // Start from the left
  const lineSpacing = 18; // Set consistent line spacing

  function addTextWithLineBreaks(text, posX, posY, maxWidth) {
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;

    words.forEach((word, index) => {
      if ((line + word).length > maxWidth || (index + 1) % 15 === 0) {
        page.drawText(line.trim(), { x: posX, y: posY - lineCount * lineSpacing, size: fontSize });
        line = word + ' '; // Start new line with current word
        lineCount++;
      } else {
        line += word + ' '; // Add word to current line
      }
    });

    if (line) {
      page.drawText(line.trim(), { x: posX, y: posY - lineCount * lineSpacing, size: fontSize }); // Draw any remaining text
    }

    return (lineCount + 1) * lineSpacing; // Return the total height used by the text
  }

  // Example usage with formData
  page.drawText(`NAME: --- ${formData.userName} ---`, { x: posX, y: posY, size: fontSize });
  posY -= 2 * lineSpacing; // Adjust position for next text
  page.drawText(`GRADE: --- ${formData.gradeLevel} ---`, { x: posX, y: posY, size: fontSize });
  posY -= 2 * lineSpacing;

  // Iterate through formData.answers to draw each
  Object.entries(formData.answers).forEach(([question, answer]) => {
    posY -= 2 * lineSpacing ; addTextWithLineBreaks(`QUESTION ${question}: --- ${answer} ---`, posX, posY, 100); // Assuming maxWidth is 100, adjust as needed
    if (posY < 50) { // Check if a new page is needed
      page = pdfDoc.addPage();
      posY = page.getHeight() - 50; // Reset Y position for the new page
    }
  });

  return await pdfDoc.save();
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
        filename: `quiz-results from ${formData.userName} .pdf`,
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
