const User = require('../models/User');

const syncUser = async (req, res) => {
    try {
        const { uid, email, name, picture } = req.firebaseUser;
        const { displayName, dateOfBirth } = req.body;

        const defaultUsername = (email ? email.split('@')[0] : 'user') + Math.floor(Math.random() * 1000);

        // Find by uid OR email (if email is provided)
        let query = { firebaseUid: uid };
        if (email) {
            query = {
                $or: [
                    { firebaseUid: uid },
                    { email: email }
                ]
            };
        }

        let user = await User.findOne(query);

        if (user) {
            // User exists (either by uid or by email)
            // Update the firebaseUid to current uid in case they matched by email but had a different provider uid
            user.firebaseUid = uid;

            if (displayName) user.displayName = displayName;
            if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
            if (!user.displayName && name) user.displayName = name;

            await user.save();
        } else {
            // Insert new user
            user = new User({
                firebaseUid: uid,
                email: email || '',
                username: defaultUsername,
                photoURL: picture || '',
                displayName: displayName || name || '',
            });
            if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
            await user.save();
        }

        return res.status(200).json({ message: 'User synchronized', user });
    } catch (error) {
        console.error('Error syncing user:', error);
        res.status(500).json({ error: 'Server error while syncing user', details: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const uid = req.firebaseUser.uid;
        const { photoURL, displayName } = req.body;

        let updateFields = {};
        if (photoURL) updateFields.photoURL = photoURL;
        if (displayName) updateFields.displayName = displayName;

        const user = await User.findOneAndUpdate(
            { firebaseUid: uid },
            { $set: updateFields },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: 'User not found' });

        return res.status(200).json({ message: 'Profile updated', user });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

module.exports = { syncUser, updateProfile };
