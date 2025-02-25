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
    const authHeader = req.headers.authorization;
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        await sendReportEmails();
        console.log('Report emails sent successfully!');
        res.send('Report emails sent successfully!');
    } catch (error) {
        console.error('Error sending report emails:', error);
        res.status(500).send('Error sending report emails.');
    }

    try {
        await sendReminderEmail('austin_f_liu@brown.edu', 'Test Email', 'Test email sent successfully!');
        res.send('Test email sent successfully!');
    } catch (error) {
        res.status(500).send('Failed to send test email.');
    }
});

// --- Export Express App for Vercel ---
module.exports = app;
