import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { updateProfile as updateFirebaseAuthProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Settings, Share, Upload, Users, MapPin, Eye, BookOpen, Star, UserPlus, Camera, Dices } from 'lucide-react';

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

                // 1. Upload to Cloudinary
                const uploadRes = await axios.post(`${API_BASE_URL}/api/upload/snap`, {
                    imageBase64: base64Image
                }, { headers: { Authorization: `Bearer ${authToken}` } });

                const newPhotoUrl = uploadRes.data.url;

                // 2. Update Firebase Auth Profile
                if (auth.currentUser) {
                    await updateFirebaseAuthProfile(auth.currentUser, { photoURL: newPhotoUrl });
                }

                // 3. Update Custom DB Profile
                const profileRes = await axios.put(`${API_BASE_URL}/api/auth/profile`, {
                    photoURL: newPhotoUrl
                }, { headers: { Authorization: `Bearer ${authToken}` } });

                // 4. Update Global State dynamically without refreshing
                setUserData(profileRes.data.user);

                // Done
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
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
        });
        setAvatarOptions(options);
    };

    const applyGeneratedAvatar = async (newPhotoUrl) => {
        if (!authToken) return;
        setAvatarOptions([]); // Close modal immediately
        setUploading(true);
        try {
            // 1. Update Firebase Auth Profile
            if (auth.currentUser) {
                await updateFirebaseAuthProfile(auth.currentUser, { photoURL: newPhotoUrl });
            }

            // 2. Update Custom DB Profile
            const profileRes = await axios.put(`${API_BASE_URL}/api/auth/profile`, {
                photoURL: newPhotoUrl
            }, { headers: { Authorization: `Bearer ${authToken}` } });

            // 3. Update Global State dynamically
            setUserData(profileRes.data.user);

            setUploading(false);
        } catch (error) {
            console.error("Failed to apply avatar", error);
            setUploading(false);
        }
    };

    const snapScore = userData?.snapScore || Math.floor(Math.random() * 5000); // Mock snap score if 0

    return (
        <div className="min-h-screen bg-surface-950 font-sans pb-10 text-surface-50 relative">
            {/* Avatar Generator Modal */}
            {avatarOptions.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm">
                    <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6 w-full max-w-sm shadow-glow relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setAvatarOptions([])}
                            className="absolute top-4 right-4 p-2 bg-surface-800 rounded-full hover:bg-surface-700 text-surface-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold text-center mb-6 text-white">Choose an Avatar</h2>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {avatarOptions.map((url, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => applyGeneratedAvatar(url)}
                                    className="cursor-pointer hover:scale-105 transition active:scale-95 bg-surface-800 rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary-500"
                                >
                                    <img src={url} alt={`Option ${idx}`} className="w-full h-auto" />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleOpenAvatarGenerator}
                            className="w-full py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-semibold text-sm transition shadow-soft flex justify-center items-center gap-2"
                        >
                            <Dices size={18} /> Re-roll Options
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 sticky top-0 bg-surface-950/80 backdrop-blur-xl z-10 border-b border-surface-800/50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-surface-800 transition text-surface-400 hover:text-white">
                        <ChevronLeft size={24} strokeWidth={2} />
                    </button>
                    <button className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 transition text-surface-400 hover:text-white border border-surface-800">
                        <Share size={18} strokeWidth={2} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleLogout} className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 transition text-surface-400 hover:text-red-400 border border-surface-800" title="Settings / Logout">
                        <Settings size={20} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Profile Info Header Content */}
            <div className="flex flex-col items-center px-4 pt-6 pb-8 relative">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                />

                <div
                    onClick={handleAvatarClick}
                    className={`w-[120px] h-[120px] bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-1 shadow-glow mb-4 relative flex items-center justify-center transform hover:scale-105 transition duration-300 cursor-pointer ${uploading ? 'opacity-50 animate-pulse' : ''}`}
                >
                    <div className="w-full h-full bg-surface-900 rounded-2xl overflow-hidden flex items-center justify-center relative">
                        {userData?.photoURL ? (
                            <img src={userData.photoURL} alt="profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl text-surface-400">👤</span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleOpenAvatarGenerator}
                    disabled={uploading}
                    className="mt-2 mb-6 flex items-center gap-2 px-5 py-2.5 bg-surface-900 hover:bg-surface-800 text-surface-50 rounded-xl font-medium text-sm transition shadow-soft border border-surface-800 disabled:opacity-50"
                >
                    <Dices size={18} className={uploading ? "animate-spin" : ""} />
                    Generate Avatar
                </button>

                <h1 className="text-2xl font-bold tracking-tight text-white text-center">
                    {userData?.displayName || currentUser?.displayName || 'Snapchatter'}
                </h1>

                <p className="text-surface-400 font-medium mt-2 flex items-center gap-2 bg-surface-900 px-4 py-1.5 rounded-full shadow-soft text-sm border border-surface-800">
                    {userData?.username || 'user'} <span className="text-surface-600">|</span> 👻 {snapScore} <span className="text-surface-600">|</span> ♈
                </p>
            </div>

            {/* Scrollable Context sections */}
            <div className="px-4 space-y-4 max-w-2xl mx-auto">

                {/* My Stories Section */}
                <div className="bg-surface-900 rounded-2xl shadow-soft overflow-hidden border border-surface-800">
                    <div className="px-4 py-3 bg-surface-900 border-b border-surface-800">
                        <h2 className="font-semibold text-sm tracking-widest text-surface-400 uppercase">My Stories</h2>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-surface-800 cursor-pointer transition">
                        <div className="flex items-center gap-4">
                            <div className="w-[45px] h-[45px] rounded-xl bg-primary-900/30 flex items-center justify-center border border-primary-800">
                                <Camera size={20} className="text-primary-500" strokeWidth={2} />
                            </div>
                            <span className="font-medium text-surface-50">Add to My Story</span>
                        </div>
                        <ChevronLeft size={20} className="text-surface-500 rotate-180" />
                    </div>
                </div>

                {/* Friends Section */}
                <div className="bg-surface-900 rounded-2xl shadow-soft overflow-hidden border border-surface-800">
                    <div className="px-4 py-3 bg-surface-900 border-b border-surface-800">
                        <h2 className="font-semibold text-sm tracking-widest text-surface-400 uppercase">Friends</h2>
                    </div>

                    <div onClick={() => navigate('/friends')} className="p-4 flex items-center justify-between hover:bg-surface-800 cursor-pointer transition border-b border-surface-800">
                        <div className="flex items-center gap-4">
                            <UserPlus size={22} className="text-primary-500" strokeWidth={2} />
                            <span className="font-medium text-surface-50">Add Friends</span>
                        </div>
                        <ChevronLeft size={20} className="text-surface-500 rotate-180" />
                    </div>
                    <div onClick={() => navigate('/friends')} className="p-4 flex items-center justify-between hover:bg-surface-800 cursor-pointer transition">
                        <div className="flex items-center gap-4">
                            <Users size={22} className="text-primary-500" strokeWidth={2} />
                            <span className="font-medium text-surface-50">My Friends</span>
                        </div>
                        <ChevronLeft size={20} className="text-surface-500 rotate-180" />
                    </div>
                </div>

                {/* Snap Map Section */}
                <div className="bg-surface-900 rounded-2xl shadow-soft overflow-hidden border border-surface-800">
                    <div className="px-4 py-3 bg-surface-900 border-b border-surface-800">
                        <h2 className="font-semibold text-sm tracking-widest text-surface-400 uppercase">Map Settings</h2>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-surface-800 cursor-pointer transition">
                        <div className="flex items-center gap-4">
                            <MapPin size={22} className="text-primary-500" strokeWidth={2} />
                            <span className="font-medium text-surface-50">Sharing Location</span>
                        </div>
                        <span className="text-xs font-semibold text-surface-400 bg-surface-800 px-2 py-1 rounded-md">Only Me</span>
                    </div>
                </div>

                {/* Spotlight Section */}
                <div className="bg-surface-900 rounded-2xl shadow-soft overflow-hidden border border-surface-800">
                    <div className="px-4 py-3 bg-surface-900 border-b border-surface-800">
                        <h2 className="font-semibold text-sm tracking-widest text-surface-400 uppercase">Spotlight</h2>
                    </div>
                    <div className="flex justify-around py-6">
                        <div className="flex flex-col items-center gap-3 cursor-pointer hover:opacity-80 transition group">
                            <div className="w-[50px] h-[50px] bg-surface-800 group-hover:bg-primary-900/30 rounded-xl border border-surface-700 group-hover:border-primary-800 flex items-center justify-center transition-colors">
                                <Star size={20} className="text-surface-300 group-hover:text-primary-500 transition-colors" strokeWidth={2} />
                            </div>
                            <span className="font-medium text-sm text-surface-400 group-hover:text-surface-50">Favorites</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 cursor-pointer hover:opacity-80 transition group">
                            <div className="w-[50px] h-[50px] bg-surface-800 group-hover:bg-primary-900/30 rounded-xl border border-surface-700 group-hover:border-primary-800 flex items-center justify-center transition-colors">
                                <Upload size={20} className="text-surface-300 group-hover:text-primary-500 transition-colors" strokeWidth={2} />
                            </div>
                            <span className="font-medium text-sm text-surface-400 group-hover:text-surface-50">Submit</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 cursor-pointer hover:opacity-80 transition group">
                            <div className="w-[50px] h-[50px] bg-surface-800 group-hover:bg-primary-900/30 rounded-xl border border-surface-700 group-hover:border-primary-800 flex items-center justify-center transition-colors">
                                <Eye size={20} className="text-surface-300 group-hover:text-primary-500 transition-colors" strokeWidth={2} />
                            </div>
                            <span className="font-medium text-sm text-surface-400 group-hover:text-surface-50">Views</span>
                        </div>
                    </div>
                </div>

                <div className="pt-6 pb-12 flex justify-center">
                    <p className="text-xs font-semibold text-surface-500 flex items-center gap-1 uppercase tracking-widest"><BookOpen size={14} /> VibeChat Workspace</p>
                </div>

            </div>
        </div>
    );
};

export default Profile;
