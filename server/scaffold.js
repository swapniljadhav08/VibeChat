const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Story = require('./models/Story');

async function scaffoldDb() {
    try {
        console.log("Connecting to", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'vibechat' });

        console.log("Creating default collections...");
        await User.createCollection();
        await Chat.createCollection();
        await Message.createCollection();
        await Story.createCollection();

        console.log("Scaffolding complete. Tree ready:");
        console.log("vibechat");
        console.log(" ├── users");
        console.log(" ├── chats");
        console.log(" ├── messages");
        console.log(" └── stories");

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

scaffoldDb();
