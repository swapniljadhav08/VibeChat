# Snapchat Web Clone - Feature Requirements & Architecture

This document defines the exact architecture, feature-set, and behavior of the Snapchat Web Clone.

## 1. System Architecture

### Frontend (Client)
- **Framework:** React JS (Vite) for rapid development and optimized builds.
- **Styling:** Tailwind CSS to recreate Snapchat's sleek, mobile-first aesthetic with utility classes.
- **Routing:** React Router DOM (Simulating swipe navigation through clever route transitions / CSS animations).
- **State Management:** Context API. We will use multiple contexts to keep it simple and clean:
  - `AuthContext`: Manages logged-in user state and Firebase token.
  - `ChatContext`: Manages active conversations and socket.io connection.
  - `CameraContext`: Manages camera permissions, stream state, and current captured media.
- **API Communication:** Axios via a dedicated `services/api.js` wrapper handling authorization headers.

### Backend (Server)
- **Environment:** Node.js + Express.js.
- **Database:** MongoDB Atlas + Mongoose.
  - *Why MongoDB?* Highly flexible for chat schemas, scalable, and easy to structure relations (Users, Messages, Stories).
- **Authentication:** Firebase Admin SDK.
  - The frontend authenticates directly with Firebase, receives an ID Token, and sends it to the backend. The backend's middleware verifies this token using Firebase Admin, ensuring secure API endpoints.
- **Media Storage:** Cloudinary.
  - Ideal for resizing and delivering images (`.jpg`/`.webp`) and short videos (`.mp4`) globally via CDN.
- **Real-Time Layer:** Socket.io.
  - Essential for typing indicators, presence (online status), read receipts, and instant message delivery.

---

## 2. Core Feature Specifications

To call this a *perfect clone*, we must implement the core pillars of Snapchat:

### A. The Camera (Landing Page)
Snapchat is a camera company; the app opens directly to the camera.
- **Web Implementation:** We will ask for webcam/mic permissions on load using `navigator.mediaDevices.getUserMedia`.
- **Photo Capture:** Drawing the current video frame to an HTML5 `<canvas>` and converting to Base64/Blob.
- **Video Capture:** Using the `MediaRecorder` API to record chunks when the user holds the capture button.
- **Camera UI:**
  - Flash toggle.
  - Camera flip (front/back on mobile browsers).
  - Post-capture editing UI (add text overlay, draw, discard).

### B. Chat & Disappearing Messages (Friends Tab)
Located to the left of the Camera.
- **Chat List:** Shows friend list, recent message status (e.g., "New Snap", "Opened", "Received x mins ago").
- **Message Types:**
  - Standard Text.
  - Snaps (Images/Videos from Camera).
  - Media (from device gallery).
- **Ephemeral Logic:**
  - When User B opens a Snap from User A, a "viewed" socket event fires.
  - The Snap is displayed for a set duration (or indefinitely until closed), then it is marked as `opened` in the DB and the media URL is removed/hidden.
- **Typing Indicators:** Real-time Bitmoji/Avatar peeking or typing bubble when the other user is typing.

### C. Stories (Discover Tab)
Located to the right of the Camera.
- **My Story:** Users can capture a media and post it directly to their timeline.
- **Expiration:** Backend logic will ensure stories older than 24 hours are not returned in queries (can be backed by a cron job to delete Cloudinary assets to save space).
- **Viewer Component:** 
  - Tapping the right side of the screen skips to the next story.
  - Tapping the left goes back.
  - Progress bar auto-advances based on media duration (default 5s for photos).

### D. Spotlight (Video Feed)
- **Infinite Vertical Feed:** Similar to TikTok.
- **Auto-Play:** Videos auto-play when they enter the viewport using `IntersectionObserver`, and pause when out of view.
- **Interactions:** Like button, Share button.

### E. Snap Map
- **Map View:** Full-screen map using an open-source tool like Leaflet.js (`react-leaflet`).
- **Location Sharing:** When users are active, their browser geolocation (`navigator.geolocation`) is sent to the backend and stored.
- **Avatars on Map:** Friends appear as their profile pictures/avatars at their last known coordinates.

### F. Profile & Memories
- **Profile Page:** Change display name, view Snap Score (calculated based on snaps sent/received), logout.
- **Memories:** A gallery of snaps the user has chosen to "Save" rather than strictly sending as ephemeral messages.

---

## 3. Database Schema Models (Mongoose)

### `User` Model
```javascript
{
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: { type: String },
  username: { type: String, unique: true },
  profilePicUrl: { type: String },
  snapScore: { type: Number, default: 0 },
  location: {
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}
```

### `Message` / `Snap` Model
```javascript
{
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['text', 'snap_photo', 'snap_video'] },
  content: { type: String }, // Text body OR Cloudinary Secure URL
  status: { type: String, enum: ['sent', 'delivered', 'opened'] },
  openedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}
```

### `Story` Model
```javascript
{
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['photo', 'video'] },
  duration: { type: Number, default: 5 }, // Seconds
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now } // Filter active where Date.now - createdAt < 24h
}
```
