const admin = require('../config/firebase');

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const User = require('../models/User');
        const dbUser = await User.findOne({ firebaseUid: decodedToken.uid });
        req.firebaseUser = decodedToken;
        req.user = dbUser; // Might be null if user is not synced yet
        next();
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return res.status(401).json({ error: `Unauthorized: Invalid token. Details: ${error.message}` });
    }
};

module.exports = { requireAuth };
