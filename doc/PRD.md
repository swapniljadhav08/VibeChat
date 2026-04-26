# VibeChat "Snap Map" (Leaflet) - Product Requirements Document (PRD)

## 1. Overview
The **VibeChat Snap Map** is a highly interactive, location-sharing feature that allows users to see their friends on a real-time world map. It will serve as a visual, interactive hub mimicking the functionality and aesthetics of Snapchat's map, enhanced with VibeChat's signature premium, glassmorphism, and neon dark-mode aesthetic.

The map will be powered by **Leaflet.js** (via `react-leaflet`) for optimal performance, smooth animations, and flexibility.

---

## 2. Core User Flow & Permissions
1. **Initial Access**: User navigates to `/map` (via Header/BottomNav).
2. **Permission Gate**: 
   - Before fully mounting the map, a premium glassmorphic modal asks for Geolocation permissions.
   - *Message*: "Allow VibeChat to find your vibe? Enable location to see friends around you."
3. **Location Retrieval**:
   - VibeChat fetches coordinates via `navigator.geolocation.watchPosition` for real-time accuracy.
   - If denied: User enters "Ghost Mode" by default. They see the map and friends (if friends allow), but their location is hidden.
4. **Map Initialization**:
   - The map initializes with a deep zoom, centering on the user's fetched coordinates.
   - The user's marker drops onto the map with a sleek animation.
5. **Populating Friends**:
   - Websocket/REST call syncs the user's location to the server.
   - The app fetches the current locations of mutual friends and renders them on the map.

---

## 3. UI/UX & Design Specifications
### 3.1 Map Aesthetics (Leaflet Integration)
- **Base Tile Layer**: Use a premium dark-mode map style. Recommended Leaflet Tile Providers:
  - *CartoDB Dark Matter* (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)
  - *Stadia Alidade Smooth Dark*
- **No Map Controls**: Hide the default Leaflet `+`/`-` zoom controls. Zooming is strictly pinch-to-zoom or double-tap driven for a clean, mobile-first app feel.

### 3.2 Floating UI Overlays
- **Top Header**: Transparent overlay with a "Back" button, Search Bar (to find friends on the map), and a "Settings/Ghost Mode" icon.
- **Current Location Button**: A floating action button (FAB) in the bottom right corner (above the BottomNav/Carousel). Clicking it triggers `map.flyTo()` to instantly smoothly pan and zoom back to the user's marker.
- **Bottom Friend Carousel**: A horizontal scrolling row (Framer Motion) showing cards of friends currently active on the map. Clicking a friend card triggers `map.flyTo()` to their specific marker.

### 3.3 Custom Map Markers (Bitmoji Alternative)
- We will replace default Leaflet pins with **Custom HTML Markers** (`L.divIcon`).
- **Avatar Marker**: A circular marker displaying the user's `photoURL` (or fallback avatar). 
- **Glowing Aura**: The marker is encased in a neon border (e.g., `#00E5FF` for self, `#7F5AF0` for friends) with a continuous CSS pulse animation to indicate real-time presence.
- **Pulsing Halo**: If a user recently updated their location (within the last 5 mins), render a subtle expanding circle under their marker.

---

## 4. Key Features & Functionality (Snapchat Parity)

### 4.1 Real-Time Tracking & `watchPosition`
- Location isn't just static. As the user walks/drives, `watchPosition` captures coordinate changes.
- The app emits `update_location` via **Socket.io** to the backend limit-debounced to once every 10-15 seconds.

### 4.2 Ghost Mode
- A toggle switch located in the Map Settings overlay.
- When enabled: The user stops emitting their location to the WebSocket. The backend sets their map visibility to `false`, instantly removing their marker from other users' maps.
- On the user's UI, their own marker changes to a "Ghost" hue (e.g., dim gray/white aura instead of neon blue) to signify no one can see them.

### 4.3 Marker Interactions (Clicking a Friend)
- Clicking a friend's marker on the map opens a robust **Bottom Sheet Modal**.
- **Bottom Sheet Contents**:
  - Large avatar and Name.
  - "Last active 5m ago in New York".
  - **Quick Chat**: An input field right in the modal to instantly shoot a message or snap.
  - **View Story/Status**: If they uploaded a public snap recently, tapping their avatar ring views it.

### 4.4 Clustering (Overlapping Markers)
- If 3 friends are hanging out in the same house, markers will overlap.
- Implement `react-leaflet-markercluster`.
- Style the cluster icon as a sleek glowing orb with the number of friends inside (e.g., a dark circle with a neon pink "3"). Tapping it zooms in to spread the markers, or opens a list of those specific users.

---

## 5. Technical Implementation Plan (for Ralph / Autonomous Agents)

### Phase 1: Leaflet Setup & Base UI
1. `npm install react-leaflet leaflet`
2. Create `MapLayout.jsx` container without standard app margins.
3. Integrate `MapContainer`, `TileLayer` (Dark theme), and a placeholder `Marker` for the local user.
4. Add CSS to hide Leaflet attribution logs and default controls to maintain the premium vibe.

### Phase 2: Location Handling & Context
1. Build a custom React hook `useLocation`.
2. Implement permission checking. If granted, use `navigator.geolocation.getCurrentPosition`.
3. Handle failure states (UI overlay: "Location access required for the full experience").
4. Bind the user's coordinates to state. Make the Leaflet map initially `flyTo` these coordinates on mount.

### Phase 3: Backend & Socket Integration
1. **Database Update**: The `User` model in MongoDB needs an updated schema: 
   ```json
   location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      updatedAt: { type: Date }
   },
   ghostMode: { type: Boolean, default: false }
   ```
2. **Socket Events**:
   - Client emits `update_location` with `{ lat, lng }`.
   - Server updates the DB and broadcasts to mutual friends: `friend_location_updated`.
3. **REST API**: GET `/api/map/friends` returning a list of friends with `location` data and `updatedAt`.

### Phase 4: Dynamic Markers & Interactions
1. Create a `CustomMarker` component that returns `react-leaflet`'s `Marker` mapped with an `icon={L.divIcon(...) }`.
2. Inject custom HTML/CSS inside `L.divIcon` to render the user's profile image with glassmorphic borders and CSS animations.
3. Loop through fetched friends and render their markers.
4. Implement the `onClick` event on markers to trigger the Bottom Sheet.

### Phase 5: UI Polish & Overlays
1. Add the horizontal `FriendCarousel` at the bottom of the screen.
2. Link carousel clicks to the parent map `useMap().flyTo([lat, lng], z)`.
3. Implement the Ghost Mode toggle in the map header.

## 6. Target Technology Stack
- **Frontend Maps**: `leaflet`, `react-leaflet`
- **UI & Animations**: `framer-motion`, `lucide-react` (icons), Tailwind CSS
- **Backend Sync**: Application's existing `Socket.io` context and Express `axios` calls.

---

## 7. Voice and Video Call Integration (ZegoCloud)

### 7.1 Overview
VibeChat will support real-time 1-on-1 Voice and Video calling natively using the **ZegoCloud UIKit**. This ensures high reliability, low latency, and a premium communication experience without the headache of managing raw WebRTC infrastructure.

### 7.2 Implementation Plan
1. **ZegoCloud Credentials Setup**:
   - The user will provide their specific App credentials.
   - Inject `VITE_ZEGO_APP_ID` and `VITE_ZEGO_SERVER_SECRET` directly into the `.env` file.
2. **Call Initiation Flow**:
   - Add specialized Call Action Buttons (Voice 📞 and Video 📹) within the `ChatRoom` header.
   - Ensure these buttons fit the dark/neon VibeChat aesthetic smoothly.
   - Tapping a button fires a WebSocket event (`incoming_call`) to the receiving friend with a unique Room ID.
3. **Immersive Call UI**:
   - Utilize `ZegoUIKitPrebuilt` (or custom Web SDK) mapped to a dedicated `/call/:roomId` page or a full-screen overlay.
   - Customize the UI config to force dark mode (`#0F0F14`), matching the application's premium glassmorphic vibe where possible.
   - Standard controls: Mute, Camera Toggle, End Call.
4. **Socket Signaling**:
   - Handle ringing rings, rejecting calls, or missing calls via Socket.io.
   - If a call is missed, insert a specialized system message inside the Chat Room (e.g., "Missed Video Call").

---
**Prepared for Ralph Loop Execution.**
*Instruction:* Treat this PRD as the ultimate ground truth for new feature scoping. Proceed incrementally.
