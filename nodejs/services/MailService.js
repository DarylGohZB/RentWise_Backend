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

    console.log("[SERVICES/MAILSERVICE] Sending registration OTP mail...");
    return transporter.sendMail(mailOptions);
  },

  sendEnquiryNotification: async function (data) {
    const {
      landlordEmail,
      landlordName,
      enquirerName,
      enquirerEmail,
      propertyTitle,
      propertyAddress,
      propertyPostalCode,
      enquiryMessage,
      enquiryId
    } = data;

    const mailOptions = {
      from: `"RentWise" <${GMAIL_USER}>`,
      to: landlordEmail,
      subject: `New Enquiry for ${propertyTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Property Enquiry</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Property Details</h3>
            <p><strong>Property:</strong> ${propertyTitle}</p>
            <p><strong>Address:</strong> ${propertyAddress}</p>
            ${propertyPostalCode ? `<p><strong>Postal Code:</strong> ${propertyPostalCode}</p>` : ''}
            <p><strong>Enquiry ID:</strong> #${enquiryId}</p>
          </div>

          <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Enquirer Information</h3>
            <p><strong>Name:</strong> ${enquirerName}</p>
            <p><strong>Email:</strong> ${enquirerEmail}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Message</h3>
            <p style="white-space: pre-wrap;">${enquiryMessage}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              Please log in to your RentWise dashboard to respond to this enquiry.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent from RentWise. Please do not reply to this email.
          </p>
        </div>
      `
    };

    console.log("[SERVICES/MAILSERVICE] Sending enquiry notification mail to:", landlordEmail);
    return transporter.sendMail(mailOptions);
  },

  sendEnquiryResponse: async function (data) {
    const {
      tenantEmail,
      tenantName,
      landlordName,
      propertyTitle,
      response,
      enquiryId
    } = data;

    const mailOptions = {
      from: `"RentWise" <${GMAIL_USER}>`,
      to: tenantEmail,
      subject: `Response to your enquiry for ${propertyTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Response to Your Enquiry</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Property Details</h3>
            <p><strong>Property:</strong> ${propertyTitle}</p>
            <p><strong>Enquiry ID:</strong> #${enquiryId}</p>
            <p><strong>Landlord:</strong> ${landlordName}</p>
          </div>

          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Response from Landlord</h3>
            <p style="white-space: pre-wrap;">${response}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              You can continue the conversation by replying to this email or contacting the landlord directly.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent from RentWise on behalf of ${landlordName}.
          </p>
        </div>
      `
    };

    console.log("[SERVICES/MAILSERVICE] Sending enquiry response mail to:", tenantEmail);
    return transporter.sendMail(mailOptions);
  }
};
