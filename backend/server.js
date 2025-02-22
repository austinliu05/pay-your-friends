// server.js
const express = require('express');
require('dotenv').config();
const { sendReminderEmail, sendReportEmails } = require('./mailer');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    res.send("Welcome to Pay Your Friends!")
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

app.get('/send-reports', async (req, res) => {
    try {
        await sendReportEmails();
        res.send('Report emails sent successfully!');
    } catch (error) {
        res.status(500).send('Error sending report emails.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
