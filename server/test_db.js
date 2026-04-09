const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = "mongodb+srv://sm2021jadhav_db_user:wCHQgJMFz0DEIDIY@cluster.mongodb.net/vibechat?retryWrites=true&w=majority";

async function test() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'vibechat' });
        console.log('connected');

        const uid = 'test-uid-123';
        const email = 'test@example.com';
        const name = 'Test User';
        const picture = '';
        const displayName = 'Explicit Display Name';
        const dateOfBirth = '2000-01-01';

        const defaultUsername = (email ? email.split('@')[0] : 'user') + Math.floor(Math.random() * 1000);

        let updateData = {
            $setOnInsert: {
                firebaseUid: uid,
                email: email || '',
                username: defaultUsername,
                profilePicUrl: picture || '',
            }
        };

        if (displayName || dateOfBirth) {
            updateData.$set = updateData.$set || {};
            if (displayName) updateData.$set.displayName = displayName;
            if (dateOfBirth) updateData.$set.dateOfBirth = new Date(dateOfBirth);
        } else if (name) {
            updateData.$setOnInsert.displayName = name;
        }

        console.log('updateData:', JSON.stringify(updateData, null, 2));

        const user = await User.findOneAndUpdate(
            { firebaseUid: uid },
            updateData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        console.log('Success:', user);

    } catch (err) {
        console.error('ERROR CAUGHT:', err.message);
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

test();
