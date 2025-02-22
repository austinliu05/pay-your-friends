require('dotenv').config();
const postmark = require('postmark');
const admin = require('firebase-admin');

// Initialize the Postmark client with your API token.
const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

/**
 * Sends an email using Postmark.
 *
 * @param {string} toEmail - Recipient's email address.
 * @param {string} subject - Subject of the email.
 * @param {string} text - Text content of the email.
 */
async function sendReminderEmail(toEmail, subject, text) {
    console.log(`Sending reminder email to ${toEmail}`);
    return client.sendEmail({
        From: 'austin_f_liu@brown.edu',
        To: toEmail,
        Subject: subject,
        TextBody: text,
        HtmlBody: `<pre>${text}</pre>`,
    });
}

/**
 * Generates report emails based on pending transactions and sends them.
 */
async function sendReportEmails() {
    console.log("Starting sendReportEmails...");
    try {
        const db = admin.firestore();

        // Query transactions from groups/no groupcest/transactions.
        const transactionsSnapshot = await db
            .collection('groups')
            .doc('no groupcest')
            .collection('transactions')
            .get();

        // Build aggregated pending map:
        // { pendingUser: { name: pendingUser, details: [ { owesTo, transactionName, amount }, ... ] } }
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
                    amount: individualAmount,
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
            const userName = doc.id; // Assuming document ID is the user's name.
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

                console.log(`Sending report email to ${pendingUser} (${email})`);
                reportPromises.push(
                    sendReminderEmail(email, 'Your Payment Report', reportMessage)
                );
            } else {
                console.log(`No email found for ${pendingUser}. Skipping report email.`);
            }
        }

        await Promise.all(reportPromises);
        console.log("Report emails sent successfully!");
    } catch (error) {
        console.error("Error sending report emails:", error);
    }
}

// Export both functions so they can be imported elsewhere.
module.exports = { sendReminderEmail, sendReportEmails };
