const nodemailer = require("nodemailer");

const sendEmail = async (email, name, otp, forget) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // must be false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // must exist in Render
    },
  });

  let subject, text, html;

  if (forget) {
    subject = "Grambazer Password Reset Code";
    text = `Dear ${name},\n\nYou requested a password reset for your Grambazer account. Please use the code below to reset your password:\n\n${otp}\n\nIf you didn't request this, please ignore this email or contact our support team.\n\nBest regards,\nThe Grambazer Team`;
    html = `
      <div style="padding: 20px; font-family: Arial, sans-serif; color: #333;">
        <h2 style="text-align: center;">Password Reset Request</h2>
        <p>Dear ${name},</p>
        <p>You requested a password reset for your Grambazer account. Please use the code below to reset your password:</p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>If you didn't request this, please ignore this email or contact our support team.</p>
        <p>Best regards,<br/>The Grambazer || Gramseba Team</p>
      </div>
    `;
  } else {
    // Default to registration email
    subject = "Grambazer Verification Code";
    text = `Dear ${name},\n\nThank you for registering with Grambazer. To complete your verification, please use the code below:\n\n${otp}\n\nIf you didn’t request this, please ignore this email or contact our support team.\n\nBest regards,\nThe Grambazer Team`;
    html = `
      <div style="padding: 20px; font-family: Arial, sans-serif; color: #333;">
        <h2 style="text-align: center;">Welcome to Grambazer!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering with Grambazer. To complete your verification, please use the code below:</p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>If you didn’t request this, please ignore this email or contact our support team.</p>
        <p>Best regards,<br/>The Grambazer || Gramseba Team</p>
      </div>
    `;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: text,
    html: html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
