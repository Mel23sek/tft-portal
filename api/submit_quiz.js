const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');

// Set up your nodemailer transport using environment variables
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
  const { width, height } = page.getSize();
  const fontSize = 12;
  page.drawText(`Name: ${formData.userName}\nGrade: ${formData.grade}\nAnswers: ${JSON.stringify(formData.answers, null, ' ')}`, {
    x: 50,
    y: height - 50, // Adjust as needed
    size: fontSize
  });
  return pdfDoc.save();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const formData = req.body;
    const pdfBytes = await generatePDF(formData);

    // Here you set both the 'from' and 'to' fields to your email address.
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to: process.env.EMAIL_USER, // Recipient address
      subject: 'Your Quiz Submission',
      text: 'Your quiz submission is attached as a PDF.',
      attachments: [{
        filename: 'quiz-submission.pdf',
        content: pdfBytes,
        contentType: 'application/pdf'
      }]
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Quiz submitted and email sent to yourself.' });
  } catch (error) {
    console.error('Error processing quiz submission:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
