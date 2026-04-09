# Snapchat Clone - Development Roadmap & Task List

This roadmap details the step-by-step process for building a fully functional web-based Snapchat clone using the React/Node.js stack.

## Phase 1: Project Initialization & Architecture Setup
- [ ] Initialize `doc/` for all planning and references.
- [ ] Initialize `server/` with `npm init -y`.
  - [ ] Install dependencies: `express`, `mongoose`, `cors`, `dotenv`, `firebase-admin`, `cloudinary`, `multer`, `socket.io`.
  - [ ] Setup standard folder structure (`controllers`, `routes`, `models`, `middleware`, `config`).
  - [ ] Create basic `server.js` and test MongoDB Atlas connection.
- [ ] Initialize `client/` using Vite (`npm create vite@latest client -- --template react`).
  - [ ] Install dependencies: `tailwindcss`, `react-router-dom`, `axios`, `firebase`, `socket.io-client`, `lucide-react` (for icons).
  - [ ] Configure Tailwind CSS.
  - [ ] Setup standard folder structure (`src/pages`, `components`, `context`, `services`).

## Phase 2: Firebase Authentication & User Context
- [ ] Set up Firebase Project & obtain config.
- [ ] **Client:**
  - [ ] Create `firebase.js` in `client/src/config/`.
  - [ ] Implement Auth Context (`AuthContext.jsx`) for global user state.
  - [ ] Build Login & Registration pages.
  - [ ] Build Google Sign-in flow.
- [ ] **Server:**
  - [ ] Initialize Firebase Admin SDK.
  - [ ] Create `authMiddleware` to verify Firebase ID tokens.
  - [ ] Create `User` Mongoose model.
  - [ ] Create `/api/auth/sync` endpoint to save/update Firebase user in MongoDB.

## Phase 3: The Camera Engine & Media Capture (The Core)
- [ ] **Client:**
  - [ ] Build Camera Screen as the default landing route `/`.
  - [ ] Use `navigator.mediaDevices.getUserMedia` to access webcam.
  - [ ] Implement Photo Capture (Canvas API).
  - [ ] Implement Video Capture (MediaRecorder API).
  - [ ] Add Camera Controls: Flip camera, toggle flash UI.
  - [ ] Build Media Preview Overlay (Cancel, Edit, Send).
- [ ] **Server:**
  - [ ] Setup Cloudinary configuration.
  - [ ] Create `/api/upload` endpoint using `multer` (memory storage) and Cloudinary upload stream.

## Phase 4: Real-time Chat & Disappearing Messages
- [x] **Server:**
  - [x] Configure `socket.io` server.
  - [x] Create Models: `Conversation`, `Message`.
  - [x] Handle socket events: `join_room`, `send_message`, `start_typing`, `stop_typing`, `message_opened`.
  - [x] Build REST endpoints for fetching conversations and history.
  - [x] Implement logic for disappearing messages (mark as viewed, then delete or hide after threshold).
- [x] **Client:**
  - [x] Build Chat List Page (Swipe left from Camera).
  - [x] Build Chat Room Interface.
  - [x] Integrate Socket.io client.
  - [x] Implement UI for sending text and captured snaps.
  - [x] Add Typing indicators and Sent/Delivered/Opened icons (Red/Blue squares).

## Phase 5: Stories System
- [ ] **Server:**
  - [ ] Create Model: `Story` (userId, mediaUrl, type, views, createdAt).
  - [ ] Create endpoint to post a story.
  - [ ] Create endpoint to fetch friend's active stories (filtering out stories older than 24 hours).
  - [ ] (Optional) Cron job to automatically delete standard stories from MongoDB/Cloudinary.
- [ ] **Client:**
  - [ ] Build Stories Page (Swipe right from Camera).
  - [ ] Build Auto-advancing Story Viewer component.
  - [ ] Add progress bars at the top of the viewer.
  - [ ] Tap right/left to skip/go back.

## Phase 6: Spotlight (Video Feed)
- [ ] **Server:**
  - [ ] Create Model: `Spotlight` (userId, videoUrl, caption, likes count, comments count).
  - [ ] Endpoints to upload Spotlight and fetch paginated public feed.
- [ ] **Client:**
  - [ ] Build Spotlight Page (Far right tab).
  - [ ] Implement Intersection Observer for auto-playing videos when they enter the viewport.
  - [ ] Build TikTok-style vertical scroll UI.
  - [ ] Add Like/Share action buttons.

## Phase 7: Snap Map & Profile/Memories
- [ ] **Server:**
  - [ ] Add location data to `User` model.
  - [ ] Create endpoint to update user location.
  - [ ] Create endpoint to fetch friends' locations.
- [ ] **Client:**
  - [ ] Integrate mapping library (e.g., Mapbox GL JS or React Leaflet).
  - [ ] Render friend avatars on the map.
  - [ ] Build Profile Screen (Settings, Add Friends via search).
  - [ ] Build Memories Drawer (fetch previously saved snaps).

## Phase 8: Polish & Deployment
- [ ] **Client:**
  - [ ] Add subtle animations (Framer Motion) for swipes and transitions.
  - [ ] Perfect responsive design for mobile browsers.
- [ ] **Deployment:**
  - [ ] Host Backend on Render or Railway.
  - [ ] Host Frontend on Vercel or Netlify.
  - [ ] Update CORS and Environment variables.
