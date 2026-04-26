import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { RotatingLines } from 'react-loader-spinner';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Home from './pages/Home';
import Friends from './pages/Friends';
import SnapMap from './pages/SnapMap';
import ChatLayout from './components/chat/ChatLayout';
import VideoCall from './pages/VideoCall';

// Global Loader component (Fast, lightweight CSS-only matching the AI neon UI)
const GlobalLoader = () => (
  <div className="flex h-screen w-screen bg-[#0F0F14] items-center justify-center relative overflow-hidden">
    {/* Ambient Background Glows */}
    <div className="absolute w-[200px] h-[200px] bg-[#7F5AF0]/10 rounded-full blur-[80px] animate-pulse"></div>
    <div className="absolute w-[150px] h-[150px] bg-[#00E5FF]/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '0.7s' }}></div>
    
    {/* Premium Lightweight Spinnner */}
    <div className="relative z-10 flex flex-col items-center gap-5">
      <div className="w-10 h-10 border-[3px] border-[#7F5AF0]/20 border-t-[#00E5FF] rounded-full animate-spin shadow-[0_0_15px_rgba(0,229,255,0.3)]"></div>
      <span className="text-white/60 font-bold tracking-[0.3em] text-[11px] uppercase animate-pulse drop-shadow-sm">VibeChat</span>
    </div>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <GlobalLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;

  return children;
};

// Auth Route Wrapper (If logged in, go to home)
const AuthRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <GlobalLoader />;
  if (currentUser) return <Navigate to="/" replace />;

  return children;
};

function AppRoutes() {
  const { loading } = useAuth();

  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-white relative font-sans">
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <SnapMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/call/:roomId"
          element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />
      </Routes>
    </div>
  );
}

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
          },
        }}
      />
      <Router>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
