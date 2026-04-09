const admin = require('./config/firebase');

async function clearOrphanedUsers() {
    try {
        console.log("Fetching users from Firebase Authentication...");
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users;

        if (users.length === 0) {
            console.log('No users found in Firebase.');
            return;
        }

        const uids = users.map((userRecord) => userRecord.uid);
        console.log(`Found ${uids.length} users. Deleting them to allow fresh signup...`);

        await admin.auth().deleteUsers(uids);
        console.log('Successfully deleted all orphaned users from Firebase!');
        console.log('You can now sign up with those emails again to sync perfectly with MongoDB.');
    } catch (error) {
        console.error('Error deleting users:', error);
    }
}

clearOrphanedUsers();
