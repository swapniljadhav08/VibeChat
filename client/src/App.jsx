import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RotatingLines } from 'react-loader-spinner';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Home from './pages/Home';
import Friends from './pages/Friends';
import SnapMap from './pages/SnapMap';
import ChatLayout from './components/chat/ChatLayout';

// Global Loader component
const GlobalLoader = () => (
  <div className="flex min-h-screen bg-[#fffde7] items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 bg-snapYellow rounded-3xl flex items-center justify-center shadow-lg transform rotate-3 mb-6">
        <span className="text-4xl">👻</span>
      </div>
      <RotatingLines
        visible={true}
        height="64"
        width="64"
        color="#3b82f6"
        strokeWidth="5"
        animationDuration="0.75"
        ariaLabel="rotating-lines-loading"
      />
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
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
