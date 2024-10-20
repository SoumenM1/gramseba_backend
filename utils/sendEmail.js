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
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Grambazer Verification Code',
    text: `Dear ${name},\n\nThank you for registering with Grambazer. To complete your verification, please use the code below:\n\n${otp}\n\nIf you didn’t request this, please ignore this email or contact our support team.\n\nBest regards,\nThe Grambazer Team`,
    html: `
      <div style="padding: 20px; font-family: Arial, sans-serif; color: #333;">
        <h2 style="text-align: center;">Welcome to Grambazer!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering with Grambazer. To complete your verification, please use the code below:</p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>If you didn’t request this, please ignore this email or contact our support team.</p>
        <p>Best regards,<br/>The Grambazer || Gramsaba Team</p>
      </div>
    `,
  };  

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
