import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Zap, ArrowRight, Mail, User, Calendar } from 'lucide-react';

import { GlassButton } from '../components/ui/GlassButton';
import { GlassInput } from '../components/ui/GlassInput';
import { OtpInput } from '../components/ui/OtpInput';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ONBOARDING_SLIDES = [
    { id: 1, title: 'Share Your Vibe', desc: 'Camera-first messaging built for the moment.', icon: Camera },
    { id: 2, title: 'Ephemeral Magic', desc: 'Disappearing messages that keep your chats clean.', icon: Sparkles },
    { id: 3, title: 'AI Enhanced', desc: 'Smarter suggestions, filters, and stories.', icon: Zap }
];

const Login = () => { // Kept component name as Login for existing Route setup
    // Nav state
    const [step, setStep] = useState('onboarding'); // onboarding, login, signup, otp
    const [slideIndex, setSlideIndex] = useState(0);

    // Form fields
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(''); // Just mockup for OTP

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Auto-advance onboarding
    useEffect(() => {
        if (step !== 'onboarding') return;
        const timer = setInterval(() => {
            setSlideIndex((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [step]);

    const handleEmailAuth = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (step === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                navigate('/');
            } else if (step === 'signup') {
                if (!name || !dob || !email || !password) {
                    setError("Please fill all fields.");
                    setLoading(false);
                    return;
                }
                
                // 1. Create User in Firebase
                const res = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(res.user, { displayName: name });

                // 2. Initial Sync to MongoDB
                const token = await res.user.getIdToken();
                try {
                    await axios.post(`${API_BASE_URL}/api/auth/sync`, {
                        displayName: name,
                        dateOfBirth: dob
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (err) {
                   console.log("MongoDB Sync Error", err);
                }

                navigate('/');
            }
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Email exists. Sign in instead.');
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
            navigate('/');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const variants = {
        enter: { opacity: 0, x: 50, scale: 0.95 },
        center: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: -50, scale: 0.95 }
    };

    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--color-base-dark)] px-4 sm:px-6 relative overflow-hidden">
            {/* Immersive Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-neon-purple)]/20 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-20%] w-[40%] h-[40%] bg-[var(--color-neon-blue)]/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                
                <AnimatePresence mode="wait">
                    {/* --- ONBOARDING STEP --- */}
                    {step === 'onboarding' && (
                        <motion.div
                            key="onboarding"
                            variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: "anticipate" }}
                            className="flex flex-col items-center glass p-8 sm:p-10 rounded-[2rem] w-full"
                        >
                            <div className="h-64 flex flex-col items-center justify-center w-full relative">
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={slideIndex}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col items-center text-center absolute w-full"
                                    >
                                        <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-neon-blue)] rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6">
                                            {React.createElement(ONBOARDING_SLIDES[slideIndex].icon, { size: 36, className: "text-white" })}
                                        </div>
                                        <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
                                            {ONBOARDING_SLIDES[slideIndex].title}
                                        </h2>
                                        <p className="text-gray-400 font-medium px-4">
                                            {ONBOARDING_SLIDES[slideIndex].desc}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <div className="flex gap-2 mb-10 w-full justify-center">
                                {ONBOARDING_SLIDES.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIndex ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
                                ))}
                            </div>

                            <div className="w-full space-y-4">
                                <GlassButton variant="neon" onClick={() => setStep('signup')}>
                                    Create Account
                                </GlassButton>
                                <GlassButton variant="secondary" onClick={() => setStep('login')}>
                                    I already have an account
                                </GlassButton>
                            </div>
                        </motion.div>
                    )}

                    {/* --- LOGIN STEP --- */}
                    {step === 'login' && (
                        <motion.div
                            key="login"
                            variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}
                            className="flex flex-col items-center glass p-8 sm:p-10 rounded-[2rem] w-full"
                        >
                            <div className="w-full flex justify-between items-center mb-10">
                                <button onClick={() => setStep('onboarding')} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                                    <ArrowRight className="rotate-180" size={24} />
                                </button>
                                <h2 className="text-xl font-bold text-white tracking-tight">Welcome Back</h2>
                                <div className="w-6" /> {/* Spacer */}
                            </div>

                            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm text-center w-full mb-6 font-medium border border-red-500/20">{error}</div>}

                            <form onSubmit={(e) => handleEmailAuth(e)} className="w-full flex flex-col items-center">
                                <GlassInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required icon={Mail} />
                                <GlassInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required icon={undefined} />
                                
                                <div className="w-full flex justify-end mb-6">
                                    <a href="#" className="text-xs text-[var(--color-neon-cyan)] hover:text-white font-medium transition-colors">Forgot password?</a>
                                </div>

                                <GlassButton type="submit" variant="neon" disabled={loading}>
                                    {loading ? 'Authenticating...' : 'Sign In'}
                                </GlassButton>
                            </form>

                            <div className="w-full flex items-center gap-4 my-6">
                                <div className="h-px bg-white/10 flex-1"></div>
                                <span className="text-xs text-gray-500 font-semibold uppercase">Or</span>
                                <div className="h-px bg-white/10 flex-1"></div>
                            </div>

                            <GlassButton variant="primary" onClick={handleGoogleAuth} disabled={loading} className="py-3.5">
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google Auth
                            </GlassButton>
                        </motion.div>
                    )}

                    {/* --- SIGNUP STEP --- */}
                    {step === 'signup' && (
                        <motion.div
                            key="signup"
                            variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}
                            className="flex flex-col items-center glass p-8 sm:p-10 rounded-[2rem] w-full"
                        >
                            <div className="w-full flex justify-between items-center mb-8">
                                <button onClick={() => setStep('onboarding')} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                                    <ArrowRight className="rotate-180" size={24} />
                                </button>
                                <h2 className="text-xl font-bold text-white tracking-tight">Create Account</h2>
                                <div className="w-6" /> {/* Spacer */}
                            </div>

                            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm text-center w-full mb-6 font-medium border border-red-500/20">{error}</div>}

                            <form onSubmit={(e) => handleEmailAuth(e)} className="w-full flex flex-col items-center">
                                <GlassInput label="Display Name" value={name} onChange={(e) => setName(e.target.value)} required icon={User} />
                                <div className="relative mb-6 w-full">
                                    <label className="absolute left-4 -top-3 text-[11px] text-[var(--color-neon-purple)] font-semibold z-20 bg-[var(--color-base-dark)] px-1 uppercase tracking-wider">Birthday</label>
                                    <div className="relative flex items-center w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                                        <div className="pl-4 text-gray-400 z-10"><Calendar size={18} /></div>
                                        <input
                                            type="date" required max={new Date().toISOString().split("T")[0]}
                                            value={dob} onChange={(e) => setDob(e.target.value)}
                                            className="w-full px-4 py-3.5 bg-transparent outline-none text-white z-10 pl-3 [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                                <GlassInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required icon={Mail} />
                                <GlassInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

                                <GlassButton type="submit" variant="neon" disabled={loading} className="mt-2">
                                    Continue
                                </GlassButton>
                            </form>
                        </motion.div>
                    )}

                    {/* --- OTP STEP --- */}
                    {step === 'otp' && (
                        <motion.div
                            key="otp"
                            variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}
                            className="flex flex-col items-center glass p-8 sm:p-10 rounded-[2rem] w-full"
                        >
                            <div className="w-full flex justify-between items-center mb-8">
                                <button onClick={() => setStep('signup')} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                                    <ArrowRight className="rotate-180" size={24} />
                                </button>
                                <div className="w-6" /> {/* Spacer */}
                            </div>

                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] border border-white/10">
                                <Mail size={32} className="text-[var(--color-neon-purple)]" />
                            </div>

                            <h2 className="text-2xl font-bold tracking-tight text-white mb-2 text-center">Check your email</h2>
                            <p className="text-gray-400 font-medium text-center px-4 mb-4 text-sm">
                                We sent a 6-digit verification code to <span className="text-white">{email}</span>
                            </p>

                            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm text-center w-full mb-6 font-medium border border-red-500/20">{error}</div>}

                            <form onSubmit={(e) => handleEmailAuth(e)} className="w-full">
                                <OtpInput length={6} value={otp} onChange={setOtp} />

                                <GlassButton type="submit" variant="neon" disabled={loading || otp.length < 6}>
                                    {loading ? 'Verifying...' : 'Verify & Setup'}
                                </GlassButton>
                            </form>

                            <p className="mt-8 text-center text-sm font-medium text-gray-400">
                                Didn't receive the code? <button className="text-[var(--color-neon-cyan)] hover:text-white transition-colors cursor-pointer ml-1 font-semibold">Resend</button>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Login;
