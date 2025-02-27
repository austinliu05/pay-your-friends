const express = require('express');
const { sendReminderEmail, sendReportEmails } = require('./mailer');
require('dotenv').config();
const app = express();

// --- Home Route ---
app.get('/', async (req, res) => {
    res.send("Welcome to Pay Your Friends!");
});

// --- Test Email Endpoint ---
app.get('/send-test-email', async (req, res) => {
    try {
        await sendReminderEmail('austin_f_liu@brown.edu', 'Test Email', 'Test email sent successfully!');
        res.send('Test email sent successfully!');
    } catch (error) {
        res.status(500).send('Failed to send test email.');
    }
});

// --- Scheduled Reports Endpoint (For Cron Job) ---
app.get('/api/scheduled-report', async (req, res) => {
    if (!process.env.CRON_SECRET) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        // Send report emails
        await sendReportEmails();
        console.log('Report emails sent successfully!');
    } catch (error) {
        console.error('Error sending report emails:', error);
        return res.status(500).send('Error sending report emails.');
    }

    try {
        // Send a test reminder email to yourself
        await sendReminderEmail('austin_f_liu@brown.edu', 'Test Email', 'Test email sent successfully!');
        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Error sending test email:', error);
        return res.status(500).send('Error sending test email.');
    }

    // Return a single response confirming both actions succeeded
    return res.send('Report emails and test email sent successfully!');
});
// --- Export Express App for Vercel ---
module.exports = app;
