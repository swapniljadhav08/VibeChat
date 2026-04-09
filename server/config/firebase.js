const admin = require('firebase-admin');
// You will need to download your Firebase Service Account JSON
// and save it as serviceAccountKey.json in the server/config folder
// OR parse it from environment variables.

// For now, initializing without credentials throws an error, so we wrap it
try {
    admin.initializeApp({
        projectId: 'vibechat-f023a'
    });
    console.log('Firebase Admin initialized successfully with projectId');
} catch (error) {
    console.warn('Firebase Admin init warning (OK if no env yet):', error.message);
}

module.exports = admin;
