// MailService: uses Mailgun to send transactional emails.
// Placeholder: fill MAILGUN_API_KEY and MAILGUN_DOMAIN in your .env

const mailgun = require('mailgun-js');

const API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;

if (!API_KEY || !DOMAIN) {
    throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN must be set in environment variables.');
}

let mg;
function getClient() {
  if (!mg) mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
  return mg;
}

module.exports = {
  sendRegistrationOtp: async function (toEmail, otp) {
    const mgc = getClient();
    const data = {
      from: `No Reply <no-reply@${DOMAIN}>`,
      to: toEmail,
      subject: 'Your registration code',
      template: "rentwisesg otp template",
      "h:X-Mailgun-Variables": JSON.stringify({
        otp_code: otp,
      }),
    };
    // return promise
    return mgc.messages().send(data);
  }
};
