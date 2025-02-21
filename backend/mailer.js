// mailer.js
require('dotenv').config();
const postmark = require('postmark');

// Initialize the Postmark client with your API token
const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

/**
 * Sends an email using Postmark.
 *
 * @param {string} toEmail - Recipient's email address.
 * @param {string} subject - Subject of the email.
 * @param {string} text - Text content of the email.
 */
async function sendReminderEmail(toEmail, subject, text) {
    return client.sendEmail({
        From: 'austin_f_liu@brown.edu', // Replace with a verified sender email in Postmark
        To: toEmail,
        Subject: subject,
        TextBody: text,
        HtmlBody: `<pre>${text}</pre>` // Optional: wraps the text in a <pre> tag for formatting
    });
}

module.exports = { sendReminderEmail };
