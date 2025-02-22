import { sendReportEmails } from '../mailer';

export default async function handler(req, res) {
    console.log("Scheduled report triggered.");

    try {
        await sendReportEmails();
        console.log("Report emails sent successfully!");
        res.status(200).send("Scheduled report emails sent successfully!");
    } catch (error) {
        console.error("Error sending scheduled report emails:", error);
        res.status(500).send("Error sending scheduled report emails.");
    }
}
