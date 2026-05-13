import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Plus, Play, ChevronLeft } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import StoryViewer from '../components/story/StoryViewer';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Stories = () => {
    const { authToken, userData } = useAuth();
    const navigate = useNavigate();
    const [myStory, setMyStory] = useState(null);
    const [friendsStories, setFriendsStories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeStoryGroup, setActiveStoryGroup] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchStories();
    }, [authToken]);

    const fetchStories = async () => {
        if (!authToken) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/stories/feed`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setMyStory(res.data.myStory || null);
            setFriendsStories(res.data.friendsStories || []);
        } catch (error) {
            console.error('Error fetching stories:', error);
            toast.error('Failed to load stories');
        } finally {
            setLoading(false);
        }
    };

    const handleStoryClick = (group) => {
        if (!group || group.stories.length === 0) return;
        setActiveStoryGroup(group);
    };

    const handleCloseViewer = () => {
        setActiveStoryGroup(null);
        fetchStories();
    };

    const handleAddStory = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            toast.loading('Uploading story...', { id: 'storyUpload' });

            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await axios.post(`${API_BASE_URL}/api/upload/media`, formData, {
                headers: { 
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            await axios.post(`${API_BASE_URL}/api/stories`, {
                mediaUrl: uploadRes.data.url,
                mediaType: file.type.startsWith('video/') ? 'video' : 'image',
                caption: '',
            }, { headers: { Authorization: `Bearer ${authToken}` } });

            toast.success('Story added!', { id: 'storyUpload' });
            fetchStories();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to add story';
            toast.error(errorMsg, { id: 'storyUpload' });
        } finally {
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const renderStoryItem = (group, isMe = false) => {
        const allViewed = group ? group.allViewed : true;
        const latestUpdate = group ? new Date(group.lastUpdated) : new Date();
        const timeString = isNaN(latestUpdate.getTime()) ? '' : latestUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <motion.div 
                whileHover={{ scale: 0.99, backgroundColor: "rgba(255,255,255,0.08)" }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-3 flex items-center gap-4 border border-white/5 shadow-sm transition min-w-0 cursor-pointer"
                onClick={() => {
                    if (group) {
                        handleStoryClick(group);
                    } else if (isMe) {
                        fileInputRef.current?.click();
                    }
                }}
            >
                <div className={`relative p-[2.5px] rounded-full shrink-0 ${!allViewed && group ? 'bg-gradient-to-tr from-[#7F5AF0] to-[#00E5FF]' : 'bg-white/10'}`}>
                    <div className="bg-[#16161D] rounded-full p-[2px]">
                        <div className="w-[50px] h-[50px] rounded-full overflow-hidden flex items-center justify-center bg-[#0F0F14]">
                            <img 
                                src={isMe ? userData?.photoURL : group?.user?.photoURL || '/default-avatar.png'} 
                                alt="Story" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                        </div>
                    </div>
                    {isMe && (
                        <div 
                            className="absolute bottom-0 right-0 bg-[#00E5FF] rounded-full p-1 border-[2.5px] border-[#0F0F14] cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.4)] z-10"
                            onClick={(e) => {
                                e.stopPropagation(); // prevent opening viewer if they specifically click the plus icon
                                fileInputRef.current?.click();
                            }}
                        >
                            <Plus size={14} strokeWidth={3} className="text-[#0F0F14]" />
                            <input 
                                ref={fileInputRef} 
                                type="file" 
                                className="hidden" 
                                accept="image/*,video/*" 
                                onChange={handleAddStory} 
                            />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-[16px] text-white tracking-tight truncate">{isMe ? 'My Status' : group?.user?.displayName || 'User'}</h3>
                    <p className="text-white/40 text-[13px] font-semibold mt-0.5 truncate">
                        {isMe && !group ? 'Tap to add status update' : timeString}
                    </p>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0F0F14] text-white font-sans overflow-hidden relative selection:bg-[#7F5AF0]/30">
            {/* Immersive Background Orbs */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[50%] bg-[#7F5AF0]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[60%] bg-[#00E5FF]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            {/* Header Area */}
            <div className="px-5 py-4 z-20 sticky top-0 shrink-0 bg-[#0F0F14]/60 backdrop-blur-2xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <h1 className="text-[26px] font-extrabold tracking-tight flex-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Updates</h1>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto w-full px-4 pt-6 pb-28 scrollbar-hide z-10 relative">
                
                {/* My Story Section */}
                <div className="mb-6">
                    {renderStoryItem(myStory, true)}
                </div>

                {/* Friends' Stories Section */}
                <div>
                    <h3 className="text-[13px] font-extrabold text-white/30 mb-3 px-2 uppercase tracking-widest">Recent Updates</h3>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-8 gap-4 opacity-70">
                            <div className="w-8 h-8 border-4 border-[#7F5AF0]/30 border-t-[#00E5FF] rounded-full animate-spin"></div>
                            <div className="text-[#00E5FF]/80 font-bold tracking-wide">Loading updates...</div>
                        </div>
                    ) : friendsStories.length > 0 ? (
                        <div className="space-y-3">
                            {friendsStories.map((group, idx) => (
                                <React.Fragment key={idx}>
                                    {renderStoryItem(group, false)}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 flex flex-col items-center justify-center text-center bg-transparent mt-4">
                            <div className="w-24 h-24 bg-[#7F5AF0]/10 rounded-full flex items-center justify-center mb-5 border border-[#7F5AF0]/20 text-[#7F5AF0] shadow-[0_0_20px_rgba(127,90,240,0.15)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#00E5FF]/10 z-0"></div>
                                <Play size={40} strokeWidth={1.5} className="z-10 ml-2" />
                            </div>
                            <p className="text-white font-extrabold text-[22px] tracking-tight mb-2">No Recent Updates</p>
                            <p className="text-white/40 text-[15px] font-medium max-w-[240px] leading-relaxed">Your friends haven't posted any new status updates yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <BottomNav />

            {activeStoryGroup && (
                <StoryViewer 
                    storyGroup={activeStoryGroup} 
                    onClose={handleCloseViewer}
                    authToken={authToken}
                />
            )}
        </div>
    );
};

export default Stories;
