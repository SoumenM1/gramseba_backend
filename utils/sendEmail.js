const nodemailer = require('nodemailer');

const sendEmail = async (email, name, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to: email, // List of recipients
    subject: 'Grambazer Verification Code', // Subject line
    html: `
      <div style="background-image: url('https://drive.google.com/file/d/17AoKdxuLAAnu_gXMlZtguE6Anra9de4y/view'); padding: 20px; font-family: Arial, sans-serif; color: #333;">
        <h2 style="text-align: center;">Welcome to Grambazer!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering with Grambazer. To complete your verification, please use the code below:</p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>If you didn’t request this, please ignore this email or contact our support team.</p>
        <p>Best regards,<br/>The Grambazer || Gramsaba Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
