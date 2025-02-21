const admin = require("firebase-admin");

// Parse the service account JSON from the environment variable
let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    // Replace literal "\n" with actual newline characters in the private key
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
} catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT JSON:", error);
    throw error;
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
}

module.exports = admin;
