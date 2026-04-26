import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { updateProfile as updateFirebaseAuthProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Settings, Share, Upload, Users, MapPin, Eye, BookOpen, Star, UserPlus, Camera, Dices, Sparkles, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Profile = () => {
    const { currentUser, userData, logout, authToken, setUserData } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [avatarOptions, setAvatarOptions] = useState([]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const handleAvatarClick = () => {
        if (!uploading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !authToken) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64Image = reader.result;
                const uploadRes = await axios.post(`${API_BASE_URL}/api/upload/snap`, {
                    imageBase64: base64Image
                }, { headers: { Authorization: `Bearer ${authToken}` } });

                const newPhotoUrl = uploadRes.data.url;

                if (auth.currentUser) {
                    await updateFirebaseAuthProfile(auth.currentUser, { photoURL: newPhotoUrl });
                }

                const profileRes = await axios.put(`${API_BASE_URL}/api/auth/profile`, {
                    photoURL: newPhotoUrl
                }, { headers: { Authorization: `Bearer ${authToken}` } });

                setUserData(profileRes.data.user);
                setUploading(false);
            };
        } catch (error) {
            console.error("Failed to update avatar", error);
            setUploading(false);
        }
    };

    const handleOpenAvatarGenerator = () => {
        const options = Array.from({ length: 8 }).map(() => {
            const seed = Math.random().toString(36).substring(7);
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=0F0F14,16161D,7F5AF0,00E5FF`;
        });
        setAvatarOptions(options);
    };

    const applyGeneratedAvatar = async (newPhotoUrl) => {
        if (!authToken) return;
        setAvatarOptions([]); 
        setUploading(true);
        try {
            if (auth.currentUser) {
                await updateFirebaseAuthProfile(auth.currentUser, { photoURL: newPhotoUrl });
            }

            const profileRes = await axios.put(`${API_BASE_URL}/api/auth/profile`, {
                photoURL: newPhotoUrl
            }, { headers: { Authorization: `Bearer ${authToken}` } });

            setUserData(profileRes.data.user);
            setUploading(false);
        } catch (error) {
            console.error("Failed to apply avatar", error);
            setUploading(false);
        }
    };

    const snapScore = userData?.snapScore || Math.floor(Math.random() * 5000);

    return (
        <div className="min-h-screen bg-[#0F0F14] font-sans pb-10 text-white relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-[#7F5AF0]/15 rounded-full blur-[140px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[20%] right-[-20%] w-[60%] h-[60%] bg-[#00E5FF]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {/* Avatar Generator Modal */}
            <AnimatePresence>
                {avatarOptions.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0F14]/90 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#16161D] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#7F5AF0]/20 rounded-full blur-[50px] pointer-events-none z-0"></div>
                            
                            <button onClick={() => setAvatarOptions([])} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10">
                                ✕
                            </button>
                            <h2 className="text-[22px] font-extrabold text-center mb-6 text-white tracking-tight flex items-center justify-center gap-2 z-10 relative">
                                <Sparkles className="text-[#00E5FF]" size={20} /> Generate AI Avatar
                            </h2>
                            <div className="grid grid-cols-4 gap-4 mb-6 relative z-10">
                                {avatarOptions.map((url, idx) => (
                                    <motion.div
                                        whileHover={{ scale: 1.1, zIndex: 10 }} whileTap={{ scale: 0.9 }}
                                        key={idx} onClick={() => applyGeneratedAvatar(url)}
                                        className="cursor-pointer bg-[#0F0F14] rounded-2xl overflow-hidden border border-white/5 hover:border-[#00E5FF] shadow-sm"
                                    >
                                        <img src={url} alt={`Option ${idx}`} className="w-full h-auto" />
                                    </motion.div>
                                ))}
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleOpenAvatarGenerator} className="w-full relative z-10 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm transition shadow-sm flex justify-center items-center gap-2">
                                <Dices size={18} className="text-[#00E5FF]" /> Re-roll Options
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 sticky top-0 bg-[#0F0F14]/60 backdrop-blur-2xl z-20 border-b border-white/5 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition text-white/80 hover:text-white">
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                    <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition text-white/80 hover:text-white border border-white/10">
                        <Share size={18} strokeWidth={2} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleLogout} className="p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 transition text-red-400 border border-red-500/20" title="Logout">
                        <LogOut size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Profile Info Header Content */}
            <div className="flex flex-col items-center px-4 pt-8 pb-8 relative z-10">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                />

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAvatarClick}
                    className={`w-[130px] h-[130px] bg-gradient-to-br from-[#7F5AF0] to-[#00E5FF] rounded-full p-1 shadow-[0_0_30px_rgba(127,90,240,0.4)] mb-5 relative flex items-center justify-center cursor-pointer ${uploading ? 'opacity-50 animate-pulse' : ''}`}
                >
                    <div className="w-full h-full bg-[#16161D] rounded-full overflow-hidden flex items-center justify-center relative border-2 border-[#0F0F14]">
                        {userData?.photoURL ? (
                            <img src={userData.photoURL} alt="profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl">😎</span>
                        )}
                        <div className="absolute bottom-2 right-2 bg-[#0F0F14] p-1.5 rounded-full border border-white/20">
                            <Camera size={14} className="text-white" />
                        </div>
                    </div>
                </motion.div>

                <h1 className="text-[28px] font-extrabold tracking-tight text-white text-center drop-shadow-md">
                    {userData?.displayName || currentUser?.displayName || 'Snapchatter'}
                </h1>

                <div className="flex items-center gap-2 mt-2 mb-6">
                    <p className="text-white/60 font-semibold bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full shadow-inner text-[13px] border border-white/10 tracking-widest uppercase">
                        @{userData?.username || 'user'}
                    </p>
                    <p className="text-[#00E5FF] font-bold bg-[#00E5FF]/10 backdrop-blur-md px-3 py-1.5 rounded-full shadow-inner text-[13px] border border-[#00E5FF]/20 flex items-center gap-1">
                        👻 {snapScore}
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenAvatarGenerator}
                    disabled={uploading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white rounded-2xl font-bold text-[14px] transition shadow-lg border border-white/20 disabled:opacity-50 backdrop-blur-md"
                >
                    <Dices size={20} className={uploading ? "animate-spin text-[#00E5FF]" : "text-[#7F5AF0]"} />
                    Generate AI Avatar
                </motion.button>
            </div>

            {/* Scrollable Context sections */}
            <div className="px-4 space-y-4 max-w-2xl mx-auto z-10 relative">

                {/* My Stories Section */}
                <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-lg border border-white/10 overflow-hidden group">
                    <div className="px-5 py-4 border-b border-white/5">
                        <h2 className="font-extrabold text-[12px] tracking-widest text-white/40 uppercase">Story & Media</h2>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition">
                        <div className="flex items-center gap-4 pl-1">
                            <div className="w-[46px] h-[46px] rounded-2xl bg-[#7F5AF0]/20 flex items-center justify-center border border-[#7F5AF0]/30 shadow-inner">
                                <Camera size={22} className="text-[#7F5AF0]" strokeWidth={2} />
                            </div>
                            <span className="font-bold text-[16px] text-white tracking-tight">Add to My Story</span>
                        </div>
                        <ChevronLeft size={20} className="text-white/30 rotate-180" />
                    </div>
                </div>

                {/* Friends Section */}
                <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-lg border border-white/10 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5">
                        <h2 className="font-extrabold text-[12px] tracking-widest text-white/40 uppercase">Social</h2>
                    </div>

                    <div onClick={() => navigate('/friends')} className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition border-b border-white/5">
                        <div className="flex items-center gap-4 pl-1">
                            <div className="w-[46px] h-[46px] rounded-2xl bg-[#00E5FF]/10 flex items-center justify-center border border-[#00E5FF]/20 shadow-inner">
                                <UserPlus size={22} className="text-[#00E5FF]" strokeWidth={2} />
                            </div>
                            <span className="font-bold text-[16px] text-white tracking-tight">Add Friends</span>
                        </div>
                        <ChevronLeft size={20} className="text-white/30 rotate-180" />
                    </div>
                    <div onClick={() => navigate('/friends')} className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition">
                        <div className="flex items-center gap-4 pl-1">
                            <div className="w-[46px] h-[46px] rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                                <Users size={22} className="text-white" strokeWidth={2} />
                            </div>
                            <span className="font-bold text-[16px] text-white tracking-tight">My Friends</span>
                        </div>
                        <ChevronLeft size={20} className="text-white/30 rotate-180" />
                    </div>
                </div>

                {/* Snap Map Section */}
                <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-lg border border-white/10 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5">
                        <h2 className="font-extrabold text-[12px] tracking-widest text-white/40 uppercase">Location</h2>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition">
                        <div className="flex items-center gap-4 pl-1">
                            <div className="w-[46px] h-[46px] rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner">
                                <MapPin size={22} className="text-green-400" strokeWidth={2} />
                            </div>
                            <span className="font-bold text-[16px] text-white tracking-tight">Ghost Mode</span>
                        </div>
                        <span className="text-[12px] font-bold text-[#0F0F14] bg-green-400 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]">Active</span>
                    </div>
                </div>

                {/* Spotlight Section */}
                <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-lg border border-white/10 overflow-hidden">
                    <div className="flex justify-around py-6">
                        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-3 cursor-pointer group">
                            <div className="w-[54px] h-[54px] bg-white/5 group-hover:bg-yellow-400/20 rounded-2xl border border-white/10 group-hover:border-yellow-400/50 flex items-center justify-center transition-colors shadow-inner">
                                <Star size={24} className="text-white/50 group-hover:text-yellow-400 transition-colors" strokeWidth={2} />
                            </div>
                            <span className="font-bold text-[13px] text-white/40 group-hover:text-white transition-colors tracking-wide">Favorites</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-3 cursor-pointer group">
                            <div className="w-[54px] h-[54px] bg-white/5 group-hover:bg-[#7F5AF0]/20 rounded-2xl border border-white/10 group-hover:border-[#7F5AF0]/50 flex items-center justify-center transition-colors shadow-inner">
                                <Upload size={24} className="text-white/50 group-hover:text-[#7F5AF0] transition-colors" strokeWidth={2} />
                            </div>
                            <span className="font-bold text-[13px] text-white/40 group-hover:text-white transition-colors tracking-wide">Submit</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-3 cursor-pointer group">
                            <div className="w-[54px] h-[54px] bg-white/5 group-hover:bg-[#00E5FF]/20 rounded-2xl border border-white/10 group-hover:border-[#00E5FF]/50 flex items-center justify-center transition-colors shadow-inner">
                                <Eye size={24} className="text-white/50 group-hover:text-[#00E5FF] transition-colors" strokeWidth={2} />
                            </div>
                            <span className="font-bold text-[13px] text-white/40 group-hover:text-white transition-colors tracking-wide">Views</span>
                        </motion.div>
                    </div>
                </div>

                <div className="pt-8 pb-12 flex justify-center opacity-40">
                    <p className="text-[11px] font-extrabold text-white flex items-center gap-1.5 uppercase tracking-[0.2em]"><BookOpen size={14} /> VibeChat Network</p>
                </div>

            </div>
        </div>
    );
};

export default Profile;
