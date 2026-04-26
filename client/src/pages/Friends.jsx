import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Search, UserPlus, Check, X, Clock, Users, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Friends = () => {
    const { authToken, userData } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('add'); // 'add', 'requests', 'friends'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [myFriends, setMyFriends] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authToken) return;
        if (activeTab === 'requests') {
            fetchRequests();
        } else if (activeTab === 'friends') {
            fetchFriends();
        } else if (activeTab === 'add') {
            searchUsers();
        }
    }, [activeTab, authToken]);

    useEffect(() => {
        if (activeTab === 'add') {
            const delayDebounceFn = setTimeout(() => {
                searchUsers();
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchQuery, activeTab]);

    const searchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/friends/search?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setSearchResults(res.data.users || []);
        } catch (error) {
            console.error('Error searching users', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/friends/requests`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setFriendRequests(res.data.requests || []);
        } catch (error) {
            console.error('Error fetching requests', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/friends`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setMyFriends(res.data.friends || []);
        } catch (error) {
            console.error('Error fetching friends', error);
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (targetId) => {
        try {
            await axios.post(`${API_BASE_URL}/api/friends/request`, { targetId }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setSearchResults(prev => prev.map(u => u._id === targetId ? { ...u, status: 'sent' } : u));
        } catch (error) {
            console.error('Error sending request', error);
        }
    };

    const acceptRequest = async (targetId) => {
        try {
            await axios.post(`${API_BASE_URL}/api/friends/accept`, { targetId }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setFriendRequests(prev => prev.filter(req => req._id !== targetId));
        } catch (error) {
            console.error('Error accepting request', error);
        }
    };

    const startChat = async (participantId) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/chat`,
                { participantId },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            navigate(`/chat/${res.data.chat._id}`);
        } catch (error) {
            console.error('Error starting chat', error);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0F0F14] text-white font-sans overflow-hidden relative selection:bg-[#7F5AF0]/30">
            {/* Immersive Background Orbs */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[50%] bg-[#7F5AF0]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[60%] bg-[#00E5FF]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            {/* Header Area */}
            <div className="px-5 py-4 z-20 sticky top-0 shrink-0 bg-[#0F0F14]/60 backdrop-blur-2xl border-b border-white/5">
                <div className="flex items-center gap-3 mb-5">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition shrink-0 text-white/80">
                        <ChevronLeft size={30} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[26px] font-extrabold tracking-tight flex-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Network</h1>
                </div>

                {/* Premium Tabs */}
                <div className="flex bg-white/5 p-1 rounded-2xl w-full relative border border-white/10 backdrop-blur-xl">
                    <button onClick={() => setActiveTab('add')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-300 z-10 ${activeTab === 'add' ? 'bg-[#0F0F14] shadow-md text-[#00E5FF] border border-white/10' : 'text-white/40 hover:text-white/80'}`}>Discover</button>
                    <button onClick={() => setActiveTab('requests')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-300 relative z-10 ${activeTab === 'requests' ? 'bg-[#0F0F14] shadow-md text-[#00E5FF] border border-white/10' : 'text-white/40 hover:text-white/80'}`}>
                        Requests
                        {friendRequests.length > 0 && activeTab !== 'requests' && (
                            <span className="absolute top-2.5 right-6 w-2.5 h-2.5 bg-[#7F5AF0] rounded-full border-[2px] border-transparent shadow-[0_0_8px_#7F5AF0] animate-pulse"></span>
                        )}
                        {friendRequests.length > 0 && activeTab === 'requests' && (
                            <span className="absolute top-2.5 right-6 w-2.5 h-2.5 bg-[#00E5FF] rounded-full border-[2px] border-[#0F0F14] shadow-[0_0_8px_#00E5FF]"></span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('friends')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-300 z-10 ${activeTab === 'friends' ? 'bg-[#0F0F14] shadow-md text-[#00E5FF] border border-white/10' : 'text-white/40 hover:text-white/80'}`}>Connections</button>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto w-full px-4 pt-6 pb-20 scrollbar-hide z-10 relative">
                
                <AnimatePresence mode="wait">
                    {/* DISCOVER TAB */}
                    {activeTab === 'add' && (
                        <motion.div key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            {/* Glass Search Bar */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-inner flex items-center px-4 h-14 mb-6 border border-white/10 focus-within:border-[#00E5FF]/40 transition-colors">
                                <Search size={22} className="text-white/40 mr-3" strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Find people by username..."
                                    className="flex-1 bg-transparent outline-none font-semibold text-white placeholder-white/40 text-[15px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                {loading && searchResults.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 gap-4 opacity-70">
                                        <div className="w-8 h-8 border-4 border-[#7F5AF0]/30 border-t-[#00E5FF] rounded-full animate-spin"></div>
                                        <div className="text-[#00E5FF]/80 font-bold tracking-wide">Scanning network...</div>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => (
                                        <motion.div whileHover={{ scale: 0.99, backgroundColor: "rgba(255,255,255,0.08)" }} key={user._id} className="bg-white/5 backdrop-blur-lg rounded-2xl p-3.5 flex items-center justify-between border border-white/5 shadow-sm transition min-w-0">
                                            <div className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer pr-2">
                                                <div className="w-[50px] h-[50px] bg-[#16161D] rounded-full overflow-hidden flex items-center justify-center border border-white/10 shadow-sm shrink-0">
                                                    {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : <div className="text-xl">😎</div>}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-[16px] text-white tracking-tight truncate">{user.displayName || user.username}</h3>
                                                    <p className="text-white/40 text-[13px] font-semibold truncate mt-0.5">@{user.username}</p>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 pl-2">
                                                {user.status === 'none' && (
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendRequest(user._id)} className="bg-gradient-to-r from-[#7F5AF0] to-[#00E5FF] text-white px-5 py-2 rounded-full font-bold text-[13px] transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                                                        <UserPlus size={16} strokeWidth={2.5} /> Connect
                                                    </motion.button>
                                                )}
                                                {user.status === 'sent' && (
                                                    <button disabled className="bg-white/10 text-white/50 border border-white/10 px-5 py-2 rounded-full font-bold text-[13px] flex items-center gap-1.5 cursor-default">
                                                        <Clock size={16} strokeWidth={2.5} /> Pending
                                                    </button>
                                                )}
                                                {user.status === 'received' && (
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => acceptRequest(user._id)} className="bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 px-5 py-2 rounded-full font-bold text-[13px] transition flex items-center gap-1.5">
                                                        <Check size={16} strokeWidth={3} /> Accept
                                                    </motion.button>
                                                )}
                                                {user.status === 'friend' && (
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => startChat(user._id)} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-1.5 rounded-full font-bold text-[13px] transition flex items-center gap-1.5">
                                                        Chat
                                                    </motion.button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : searchQuery ? (
                                    <div className="p-10 flex flex-col items-center justify-center text-center bg-white/5 rounded-3xl border border-white/10 mt-4 backdrop-blur-sm">
                                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4 text-white/30">
                                            <Search size={28} strokeWidth={2} />
                                        </div>
                                        <p className="text-white font-extrabold text-[18px] mb-1 drop-shadow-sm">Signal Lost</p>
                                        <p className="text-white/40 text-[14px] font-medium max-w-[200px]">No users found matching that specific vibe.</p>
                                    </div>
                                ) : (
                                    <div className="p-10 flex flex-col items-center justify-center text-center bg-transparent mt-4">
                                        <div className="w-24 h-24 bg-[#7F5AF0]/10 rounded-full flex items-center justify-center mb-5 border border-[#7F5AF0]/20 text-[#7F5AF0] shadow-[0_0_20px_rgba(127,90,240,0.15)] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#00E5FF]/10 z-0"></div>
                                            <Users size={40} strokeWidth={1.5} className="z-10" />
                                        </div>
                                        <p className="text-white font-extrabold text-[22px] tracking-tight mb-2">Build Your Squad</p>
                                        <p className="text-white/40 text-[15px] font-medium max-w-[240px] leading-relaxed">Expand your network to discover new AI-powered connections.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* REQUESTS TAB */}
                    {activeTab === 'requests' && (
                        <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-3">
                            {friendRequests.length > 0 ? (
                                friendRequests.map(user => (
                                    <motion.div whileHover={{ scale: 0.99 }} key={user._id} className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 flex items-center justify-between border border-[#7F5AF0]/30 shadow-[0_0_15px_rgba(127,90,240,0.1)] transition min-w-0">
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                                            <div className="w-[56px] h-[56px] bg-[#16161D] rounded-full overflow-hidden flex items-center justify-center border border-white/10 shadow-sm shrink-0">
                                                {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : <div className="text-2xl">😎</div>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-[16px] text-white tracking-tight truncate">{user.displayName || user.username}</h3>
                                                <p className="text-[#00E5FF] text-[12px] font-extrabold mt-0.5 truncate tracking-widest">WANTS TO CONNECT</p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-2 pl-2 border-l border-white/10 ml-2">
                                            <motion.button whileTap={{ scale: 0.8 }} className="w-[42px] h-[42px] bg-white/5 border border-white/10 text-white/50 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition">
                                                <X size={20} strokeWidth={2.5} />
                                            </motion.button>
                                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => acceptRequest(user._id)} className="w-[42px] h-[42px] bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] rounded-full flex items-center justify-center hover:bg-[#00E5FF]/30 transition shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                                                <Check size={20} strokeWidth={3} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-12 flex flex-col items-center justify-center text-center mt-8 opacity-80">
                                    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/20 mb-6 drop-shadow-lg">
                                        <UserCheck size={40} strokeWidth={1.5} />
                                    </div>
                                    <p className="text-white font-extrabold text-[22px] mb-2 tracking-tight">Zero Pending</p>
                                    <p className="text-white/40 text-[15px] font-medium max-w-[240px] leading-relaxed">No new connection requests. Your grid is clear for now.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* FRIENDS TAB */}
                    {activeTab === 'friends' && (
                        <motion.div key="friends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-3">
                            {myFriends.length > 0 ? (
                                myFriends.map(user => (
                                    <motion.div whileHover={{ scale: 0.99, backgroundColor: "rgba(255,255,255,0.08)" }} key={user._id} className="bg-white/5 backdrop-blur-lg rounded-2xl p-3 flex items-center justify-between border border-white/5 shadow-sm transition min-w-0">
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                                            <div className="w-[46px] h-[46px] bg-[#16161D] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/10 shadow-sm relative">
                                                 {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : <div className="text-xl">😎</div>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-[16px] text-white tracking-tight truncate">{user.displayName || user.username}</h3>
                                                <p className="text-white/40 text-[13px] font-semibold truncate mt-0.5">@{user.username}</p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 pl-2">
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => startChat(user._id)} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full font-bold text-[13px] transition flex items-center gap-1.5 border border-white/10">
                                                Message
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-12 flex flex-col items-center justify-center text-center mt-8">
                                    <div className="w-24 h-24 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-full flex items-center justify-center mb-6 text-[#00E5FF] shadow-inner relative">
                                         <Users size={40} strokeWidth={1.5} className="drop-shadow-[0_0_8px_#00E5FF]" />
                                    </div>
                                    <p className="text-white font-extrabold text-[22px] mb-2 tracking-tight">Empty Grid</p>
                                    <p className="text-white/40 text-[15px] font-medium max-w-[240px] leading-relaxed mb-8">It's a little quiet here. Go to Discover to find people you know!</p>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab('add')} className="px-8 py-3.5 bg-gradient-to-r from-[#7F5AF0] to-[#00E5FF] text-white font-bold rounded-full shadow-[0_0_20px_rgba(127,90,240,0.4)] transition">
                                        Discover Connections
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Friends;
