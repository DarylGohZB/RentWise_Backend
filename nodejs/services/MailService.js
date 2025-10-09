const nodemailer = require('nodemailer');
const { GMAIL_USER, GMAIL_PASS } = require('../config');

if (!GMAIL_USER || !GMAIL_PASS) {
  throw new Error('[SERVICES/MAILSERVICE] GMAIL_USER and GMAIL_PASS must be set in environment variables.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

module.exports = {
  sendRegistrationOtp: async function (toEmail, otp) {
    const mailOptions = {
      from: `"RentWise" <${GMAIL_USER}>`,
      to: toEmail,
      subject: 'Your RentWise Registration Code',
      html: `
        <div style="font-family: sans-serif;">
          <h2>Welcome to RentWise</h2>
          <p>Your OTP code is:</p>
          <h1>${otp}</h1>
          <p>This code will expire in a few minutes.</p>
        </div>
      `
    };

    console.log("[SERVICES/MAILSERVICE] Sending mail...");
    return transporter.sendMail(mailOptions);
  }
};
