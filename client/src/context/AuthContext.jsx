import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authToken, setAuthToken] = useState(null);

    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const token = await user.getIdToken();
                    setAuthToken(token);

                    try {
                        const res = await axios.post(`${API_BASE_URL}/api/auth/sync`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setUserData(res.data.user);
                    } catch (syncErr) {
                        console.error('Failed to sync user data with backend:', syncErr);
                        // Do not clear authToken, just userData, to prevent infinite loading in ChatList
                        setUserData(null);
                    }
                } catch (err) {
                    console.error('Failed to get Firebase token:', err);
                    setAuthToken(null);
                    setUserData(null);
                }
            } else {
                setAuthToken(null);
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        return firebaseSignOut(auth);
    };

    const value = {
        currentUser,
        userData,
        authToken,
        loading,
        logout,
        setUserData,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
