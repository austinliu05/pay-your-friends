// api/scheduled-report.js
export default async function handler(req, res) {
    // Your code to send report emails here
    // You can import your sendReportEmails function and call it
    try {
        await sendReportEmails(); // your function that sends emails
        res.status(200).send("Scheduled report emails sent successfully!");
    } catch (error) {
        res.status(500).send("Error sending scheduled report emails.");
    }
}
