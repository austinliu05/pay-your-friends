// firebase.js
const admin = require("firebase-admin");

// Parse the service account JSON from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Export the admin instance for use in other parts of your app
module.exports = admin;
