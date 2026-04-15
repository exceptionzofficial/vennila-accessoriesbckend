const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key
const serviceAccountPath = 'F:\\New folder (40)\\vennila-accessories-firebase-adminsdk-fbsvc-a4cf526345.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath)
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };
