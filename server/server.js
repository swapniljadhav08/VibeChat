require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.io setup for Phase 4
const io = new Server(server, {
    cors: {
        origin: '*', // To be restricted in production
        methods: ['GET', 'POST']
    }
});
require('./sockets')(io);


// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

if (MONGO_URI) {
    const mongooseOptions = {
        dbName: 'vibechat',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        maxPoolSize: 10,
        waitQueueTimeoutMS: 10000
    };

    mongoose.connect(MONGO_URI, mongooseOptions)
        .then(() => console.log('MongoDB Connected to vibechat db'))
        .catch(err => {
            console.error('MongoDB connection error:', err.message);
            console.log('Retrying connection in 5 seconds...');
            setTimeout(() => {
                mongoose.connect(MONGO_URI, mongooseOptions)
                    .catch(retryErr => console.error('Retry failed:', retryErr.message));
            }, 5000);
        });
} else {
    console.warn('MONGODB_URI not set. Skipping database connection.');
}

// Routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');
const friendRoutes = require('./routes/friend');
const mapRoutes = require('./routes/map');
const notificationRoutes = require('./routes/notification');

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/notifications', notificationRoutes);

const path = require('path');

// ... [Keep existing routes]

// Basic health route (Keep API test route)
app.get('/api/test', (req, res) => {
    res.json({ message: "VibeChat API is working 🚀" });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route to serve the React app for any unhandled routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start listening
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
