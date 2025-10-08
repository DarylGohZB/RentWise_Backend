// MailService: uses Mailgun to send transactional emails.
// Placeholder: fill MAILGUN_API_KEY and MAILGUN_DOMAIN in your .env

const mailgun = require('mailgun-js');

const API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;
const IS_CONFIGURED = Boolean(API_KEY && DOMAIN);

let mg;
function getClient() {
  if (!IS_CONFIGURED) {
    throw new Error('Mailgun not configured: set MAILGUN_API_KEY and MAILGUN_DOMAIN');
  }
  if (!mg) mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
  return mg;
}

module.exports = {
  sendRegistrationOtp: async function (toEmail, otp) {
    if (!IS_CONFIGURED) {
      console.warn('MailService: MAILGUN env not set; skipping email send');
      return { skipped: true };
    }
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
    return mgc.messages().send(data);
  }
};
