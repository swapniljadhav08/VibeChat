import React, { useState } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);

    // Fields
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // Just log in
                await signInWithEmailAndPassword(auth, email, password);
                // Sync implicitly handled by App.jsx or context on login
                navigate('/');
            } else {
                if (!name || !dob || !email || !password) {
                    setError("Please fill all fields.");
                    setLoading(false);
                    return;
                }

                // 1. Create User in Firebase
                const res = await createUserWithEmailAndPassword(auth, email, password);

                // Optionally update firebase profile
                await updateProfile(res.user, { displayName: name });

                // 2. Initial Sync to MongoDB with extra fields
                const token = await res.user.getIdToken();
                await axios.post(`${API_BASE_URL}/api/auth/sync`, {
                    displayName: name,
                    dateOfBirth: dob
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                navigate('/');
            }
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already exists. Try logging in.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            setLoading(true);
            await signInWithPopup(auth, googleProvider);
            // Wait for AuthContext / App to handle the rest, navigating to home
            navigate('/');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-4 sm:px-6 relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/30 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-800/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md bg-surface-900/80 backdrop-blur-xl border border-surface-800 rounded-3xl shadow-glow p-8 sm:p-10 text-surface-50 relative z-10">

                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center mb-2 tracking-tight text-white">
                    {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-center text-surface-400 mb-8 font-medium">
                    {isLogin ? "Enter your credentials to access your account." : "Start connecting with your team today."}
                </p>

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm text-center mb-6 font-medium border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="E.g., Jane Doe"
                                    className="w-full px-4 py-3 bg-surface-950/50 border border-surface-800 rounded-xl focus:bg-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition duration-200 text-surface-50 placeholder-surface-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Date of Birth</label>
                                <input
                                    type="date"
                                    required
                                    max={new Date().toISOString().split("T")[0]}
                                    className="w-full px-4 py-3 bg-surface-950/50 border border-surface-800 rounded-xl focus:bg-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition duration-200 text-surface-50 [color-scheme:dark]"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            placeholder="hello@company.com"
                            className="w-full px-4 py-3 bg-surface-950/50 border border-surface-800 rounded-xl focus:bg-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition duration-200 text-surface-50 placeholder-surface-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider">Password</label>
                            {isLogin && <a href="#" className="text-xs text-primary-500 hover:text-primary-400 font-medium">Forgot password?</a>}
                        </div>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-surface-950/50 border border-surface-800 rounded-xl focus:bg-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition duration-200 text-surface-50 placeholder-surface-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 mt-2 bg-primary-600 text-white font-medium text-sm rounded-xl shadow-lg shadow-primary-900/20 hover:bg-primary-500 hover:shadow-primary-900/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Continue')}
                    </button>
                </form>

                <div className="mt-8 flex items-center justify-between">
                    <span className="border-b border-surface-800 w-1/4"></span>
                    <span className="text-xs text-center text-surface-500 uppercase font-semibold tracking-wider">or continue with</span>
                    <span className="border-b border-surface-800 w-1/4"></span>
                </div>

                <button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="mt-6 flex items-center justify-center w-full py-3 bg-surface-950/50 border border-surface-800 text-surface-50 font-medium text-sm rounded-xl hover:bg-surface-800 hover:border-surface-700 transition-all duration-200"
                >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </button>

                <p className="mt-8 text-center text-sm font-medium text-surface-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="text-primary-500 font-semibold hover:text-primary-400 hover:underline transition-colors"
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
