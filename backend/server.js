// server.js
const express = require('express');
require('dotenv').config();
const cron = require('node-cron');
const { sendReminderEmail } = require('./mailer');
const admin = require('./firebase'); // firebase.js initializes Firebase Admin SDK

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

// --- Function to Generate and Send Report Emails ---
async function sendReportEmails() {
    try {
        const db = admin.firestore();

        // Query transactions from groups/no groupcest/transactions
        const transactionsSnapshot = await db
            .collection('groups')
            .doc('no groupcest')
            .collection('transactions')
            .get();

        // Build aggregated pending map:
        // {
        //    pendingUser: {
        //      name: pendingUser,
        //      details: [ { owesTo, transactionName, amount }, ... ]
        //    },
        //    ...
        // }
        const pendingMap = {};
        transactionsSnapshot.forEach((doc) => {
            const data = doc.data();
            const pendingArray = data.pending || [];
            const individualAmount = parseFloat(data.individualAmount) || 0;
            const owesTo = data.user;
            const transactionName = data.transaction || "Unnamed Transaction";
            pendingArray.forEach((pendingUser) => {
                if (!pendingMap[pendingUser]) {
                    pendingMap[pendingUser] = { name: pendingUser, details: [] };
                }
                pendingMap[pendingUser].details.push({
                    owesTo,
                    transactionName,
                    amount: individualAmount
                });
            });
        });

        // Query users from groups/no groupcest/users to map names to emails.
        const usersSnapshot = await db
            .collection('groups')
            .doc('no groupcest')
            .collection('users')
            .get();
        const userEmailMap = {};
        usersSnapshot.forEach((doc) => {
            const data = doc.data();
            const userName = doc.id; // Assuming document ID is the user’s name
            const email = data.email;
            if (email) {
                userEmailMap[userName] = email;
            }
        });

        // For each pending user in pendingMap that has a corresponding email,
        // build a report message and send an email.
        const reportPromises = [];
        for (const pendingUser in pendingMap) {
            const email = userEmailMap[pendingUser];
            if (email) {
                let reportMessage = `Hello ${pendingUser},\n\nHere is a summary of what you owe:\n\n`;
                pendingMap[pendingUser].details.forEach((detail) => {
                    reportMessage += `- You owe $${detail.amount.toFixed(2)} for "${detail.transactionName}" to ${detail.owesTo}.\n`;
                });
                reportMessage += `\nPlease settle your dues!`;

                reportPromises.push(
                    sendReminderEmail(email, 'Your Payment Report', reportMessage)
                );
            } else {
                console.log(`No email found for ${pendingUser}. Skipping report email.`);
            }
        }

        await Promise.all(reportPromises);
        console.log('Report emails sent successfully!');
    } catch (error) {
        console.error("Error sending report emails:", error);
    }
}

// --- Schedule the Report Email Job ---
// This schedule will run every day at 9:00 AM EST.
cron.schedule('0 9 * * *', () => {
    console.log('Running scheduled report email job...');
    sendReportEmails();
}, {
    timezone: 'America/New_York'
});

// --- Optional: Expose an endpoint to trigger sending reports manually ---
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
