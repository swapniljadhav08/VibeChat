# Snapchat Web Clone - Environment Setup Guide

This document defines the exact folder structure and initial commands to execute Phase 1.

## 1. Folder Structure Overview

```text
VibeChat/
 ├── doc/                 # All planning and architectural documents
 │    ├── 01_Environment_Setup.md
 │    ├── 02_Feature_Requirements_and_Architecture.md
 │    └── 03_Development_Roadmap.md
 │
 ├── client/              # Frontend React application
 │    ├── src/
 │    │    ├── assets/    # Static images, icons
 │    │    ├── components/# Reusable UI (Button, Input, Avatar)
 │    │    ├── context/   # AuthContext, ChatContext, CameraContext
 │    │    ├── layout/    # Main Swipe Layout wrapper
 │    │    ├── pages/     # Camera, ChatList, ChatRoom, Stories, Spotlight
 │    │    ├── services/  # Axios API instances, Firebase config
 │    │    ├── utils/     # Helper functions (time ago, formatters)
 │    │    ├── App.jsx    # Router setup
 │    │    └── index.css  # Tailwind entry
 │    ├── package.json
 │    └── vite.config.js
 │
 └── server/              # Backend Node.js application
      ├── config/         # DB connection, Firebase Admin instance, Cloudinary config
      ├── controllers/    # Route handlers (auth.js, chat.js, stories.js, users.js)
      ├── middleware/     # requireAuth (verify Firebase token), multer config
      ├── models/         # Mongoose Schemas (User, Message, Story, Spotlight)
      ├── routes/         # Express router definitions
      ├── utils/          # Sockets setup, helper functions
      ├── server.js       # Express app and Socket.io entry point
      ├── .env            # Environment variables
      └── package.json
```

## 2. Environment Variables Required (.env)

### Client (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Server (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/snapchat_clone
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
# Firebase Service Account JSON will be stored securely or parsed as base64 environment variable.
```

## 3. Initialization Commands

To get the repository ready to begin coding Phase 2, the following commands will be run:

```bash
# Frontend Init
npm create vite@latest client -- --template react
cd client
npm install
npm install tailwindcss postcss autoprefixer react-router-dom axios firebase socket.io-client lucide-react framer-motion
npx tailwindcss init -p

# Backend Init
cd ../
mkdir server
cd server
npm init -y
npm install express mongoose cors dotenv firebase-admin cloudinary multer socket.io
npm install -D nodemon
```
