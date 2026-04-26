import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, MessageSquarePlus, Search, Camera, UserPlus, Mic, Image as ImageIcon, FileText, Sparkles, X, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ChatList = () => {
    const { authToken, currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [users, setUsers] = useState([]);
    const [showNewChat, setShowNewChat] = useState(false);
    const [loading, setLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [searchFriendQuery, setSearchFriendQuery] = useState('');

    useEffect(() => {
        if (!userData) return;
        const socket = io(API_BASE_URL);
        socket.emit('register_user', userData._id);
        socket.on('online_users', (users) => {
            setOnlineUsers(users);
        });
        return () => socket.disconnect();
    }, [userData]);

    useEffect(() => {
        if (!authToken) {
            const fallbackTimer = setTimeout(() => setLoading(false), 5000);
            return () => clearTimeout(fallbackTimer);
        }

        const fetchChats = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/chat`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                setChats(res.data.chats || []);
            } catch (error) {
                console.error('Error fetching chats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, [authToken]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/chat/users`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setUsers(res.data.users || []);
            setShowNewChat(true);
        } catch (error) {
            console.error('Error fetching users', error);
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

    const formatTimestamp = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessagePreview = (msg) => {
        if (!msg) return <span className="text-[#00E5FF] font-medium tracking-wide">New Chat</span>;
        
        const isMe = String(msg.senderId?._id || msg.senderId) === String(userData?._id);
        
        let prefix = "";
        if (msg.messageType === 'image') return <span className="flex items-center gap-1.5"><ImageIcon size={14} className="text-[#7F5AF0]" /> Photo</span>;
        if (msg.messageType === 'audio') return <span className="flex items-center gap-1.5"><Mic size={14} className="text-[#00E5FF]" /> Voice Note</span>;
        if (msg.messageType === 'document') return <span className="flex items-center gap-1.5"><FileText size={14} className="text-gray-400" /> Document</span>;
        
        return <span className="truncate">{msg.text || msg.content || 'Sent a message'}</span>;
    };

    return (
        <div className="h-full w-full bg-[#0F0F14] text-white overflow-hidden flex flex-col font-sans relative select-none">
            {/* Ambient Animated Glows for Premium Vibe */}
            <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[60%] bg-[#7F5AF0]/15 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#00E5FF]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            {/* Premium Header */}
            <div className="flex items-center justify-between px-4 py-4 bg-[#0F0F14]/60 backdrop-blur-xl border-b border-white/5 z-10 w-full shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition shrink-0 flex items-center justify-center text-white/80 hover:text-white group">
                        <ChevronLeft size={28} strokeWidth={2.5} />
                        <Camera size={18} strokeWidth={2.5} className="ml-[-4px] opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div onClick={() => navigate('/profile')} className="w-[40px] h-[40px] rounded-full bg-white/10 border border-white/20 p-0.5 overflow-hidden cursor-pointer hover:scale-105 transition shrink-0 shadow-[0_0_15px_rgba(127,90,240,0.3)]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                            {userData?.photoURL || currentUser?.photoURL ? (
                                <img src={userData?.photoURL || currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">😎</div>
                            )}
                        </div>
                    </div>
                </div>
                
                <h1 className="text-[22px] font-extrabold tracking-tight absolute left-1/2 transform -translate-x-1/2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 drop-shadow-md">
                    VibeChat
                </h1>
                
                <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => alert("AI Prioritization coming soon!")} className="flex items-center justify-center w-[40px] h-[40px] bg-white/5 border border-white/10 rounded-full cursor-pointer hover:bg-white/10 transition text-[#00E5FF]">
                        <Sparkles size={20} strokeWidth={2} className="drop-shadow-[0_0_8px_#00E5FF]" />
                    </motion.div>
                </div>
            </div>

            {/* Smart Search Bar */}
            <div className="px-4 py-3 z-10">
                <div className="w-full h-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center px-4 focus-within:bg-white/10 focus-within:border-[#7F5AF0]/50 transition-all shadow-inner">
                    <Search size={20} className="text-white/40 mr-3" />
                    <input type="text" placeholder="Explore chats or ask AI..." className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 font-medium text-[15px]" />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto w-full z-10 scrollbar-hide relative pb-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-white/50">
                        <div className="w-8 h-8 border-4 border-[#7F5AF0]/30 border-t-[#00E5FF] rounded-full animate-spin shadow-[0_0_15px_#00E5FF]"></div>
                        <p className="font-semibold tracking-wide">Syncing universe...</p>
                    </div>
                ) : chats.length > 0 ? (
                    <div className="px-2 flex flex-col gap-1.5">
                        <AnimatePresence>
                            {chats.map(chat => {
                                const other = chat.participants.find(p => String(p._id) !== String(userData?._id)) || chat.participants[0];
                                const isOnline = other?._id && onlineUsers.includes(other._id);
                                const isNew = !chat.lastMessage?.text;
                                const isMe = String(chat.lastMessage?.senderId?._id || chat.lastMessage?.senderId) === String(userData?._id);

                                return (
                                    <motion.div 
                                        key={chat._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ scale: 0.99, backgroundColor: "rgba(255,255,255,0.08)" }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate(`/chat/${chat._id}`)} 
                                        className="w-full flex items-center p-3 bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl cursor-pointer transition-colors shadow-sm overflow-hidden relative group"
                                    >
                                        <div className="relative mr-4 shrink-0">
                                            <div className="w-[56px] h-[56px] bg-gradient-to-tr from-gray-800 to-gray-700 p-0.5 rounded-full overflow-hidden shadow-lg group-hover:shadow-[0_0_15px_rgba(127,90,240,0.4)] transition-shadow">
                                                <div className="w-full h-full bg-[#0F0F14] rounded-full overflow-hidden">
                                                    {other?.photoURL ? <img src={other.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">😎</div>}
                                                </div>
                                            </div>
                                            {isOnline && (
                                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#0F0F14] rounded-full flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 bg-[#00E5FF] rounded-full shadow-[0_0_8px_#00E5FF] animate-pulse"></div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex justify-between items-end mb-1">
                                                <h3 className="font-bold text-[17px] text-white truncate tracking-tight">{other?.displayName || other?.username || 'Unknown'}</h3>
                                                <span className="text-[12px] font-semibold text-white/40 shrink-0">{formatTimestamp(chat.lastMessage?.timestamp)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className={`text-[14px] truncate flex-1 font-medium ${isNew || (!isMe && chat.lastMessage?.status !== 'read') ? 'text-white' : 'text-white/50'}`}>
                                                    <span className="flex items-center gap-1.5">
                                                        {isMe && !isNew && (
                                                            <span>
                                                                {chat.lastMessage?.status === 'read' ? <CheckCheck size={16} className="text-[#00E5FF]" /> : <Check size={16} className="text-white/40" />}
                                                            </span>
                                                        )}
                                                        {renderMessagePreview(chat.lastMessage)}
                                                    </span>
                                                </div>
                                                {/* Unread Badge */}
                                                {!isMe && !isNew && chat.lastMessage?.status !== 'read' && (
                                                    <div className="w-5 h-5 bg-[#7F5AF0] rounded-full shadow-[0_0_10px_#7F5AF0] flex items-center justify-center text-[10px] font-bold text-white shrink-0 ml-2">
                                                        1
                                                    </div>
                                                )}
                                                {isNew && (
                                                    <div className="w-2.5 h-2.5 bg-[#00E5FF] rounded-full shadow-[0_0_8px_#00E5FF] ml-2 shrink-0"></div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-32 text-center px-8 z-10 relative">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            transition={{ type: "spring" }}
                            className="w-28 h-28 mb-6 relative"
                        >
                            <div className="absolute inset-0 bg-[#7F5AF0] blur-[40px] opacity-40 rounded-full"></div>
                            <div className="w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl rotate-12">
                                <MessageSquarePlus size={48} className="text-[#00E5FF] drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] -rotate-12" />
                            </div>
                        </motion.div>
                        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">No conversations yet</h2>
                        <p className="text-white/50 font-medium text-[15px] max-w-xs leading-relaxed">The universe is quiet. Tap below to start a new dynamic chat.</p>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <AnimatePresence>
                {!showNewChat && (
                    <motion.button 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchUsers}
                        className="absolute bottom-8 right-6 w-16 h-16 bg-gradient-to-tr from-[#7F5AF0] to-[#00E5FF] rounded-full shadow-[0_8px_30px_rgba(127,90,240,0.6)] flex items-center justify-center z-40 border border-white/20"
                    >
                        <MessageSquarePlus size={28} className="text-white drop-shadow-md" strokeWidth={2.5} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Smart New Chat Slide-up Modal */}
            <AnimatePresence>
                {showNewChat && (
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-x-0 bottom-0 h-[90%] z-50 bg-[#16161D]/90 backdrop-blur-2xl rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
                    >
                        {/* Notch Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2">
                            <div className="w-14 h-1.5 bg-white/20 rounded-full"></div>
                        </div>

                        {/* Modals Header */}
                        <div className="flex items-center justify-between px-6 pb-4 pt-2 shrink-0">
                            <h2 className="text-[24px] font-extrabold text-white tracking-tight drop-shadow-sm flex items-center gap-2">
                                <Sparkles size={22} className="text-[#7F5AF0]" /> Start Chat
                            </h2>
                            <button onClick={() => setShowNewChat(false)} className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition active:scale-90 text-white/70">
                                <X size={24} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Add Friend Banner */}
                        <div className="px-6 pt-2 pb-5 shrink-0">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/friends')}
                                className="w-full p-5 bg-gradient-to-r from-[#7F5AF0]/20 to-[#00E5FF]/20 border border-white/10 rounded-2xl cursor-pointer hover:border-white/20 transition-all flex items-center relative overflow-hidden"
                            >
                                <div className="z-10 bg-[#7F5AF0] p-3 rounded-xl mr-4 shadow-[0_0_15px_#7F5AF0]">
                                    <UserPlus size={24} className="text-white" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 z-10">
                                    <h3 className="text-white font-bold text-[17px] tracking-tight">Discover Network</h3>
                                    <p className="text-[#00E5FF] font-medium text-[13px] mt-0.5">Find new friends using AI</p>
                                </div>
                                <div className="absolute right-0 top-0 w-32 h-32 bg-[#00E5FF]/20 blur-[50px]"></div>
                            </motion.div>
                        </div>

                        {/* Search Friends */}
                        <div className="px-6 pb-4 shrink-0">
                            <div className="bg-[#0F0F14] rounded-2xl flex items-center px-4 h-12 border border-white/5 focus-within:border-[#7F5AF0]/50 transition-colors shadow-inner">
                                <Search size={20} className="text-white/40 mr-2.5" strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Search connections..."
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 font-medium text-[15px]"
                                    value={searchFriendQuery}
                                    onChange={(e) => setSearchFriendQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Friends List */}
                        <div className="flex-1 overflow-y-auto pb-8 scrollbar-hide px-4">
                            {(() => {
                                const q = searchFriendQuery.toLowerCase();
                                const filtered = users.length > 0 ? users.filter(u => u.displayName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)) : [];
                                return filtered.length > 0 ? filtered.map((u, i) => (
                                <motion.div 
                                    whileHover={{ scale: 0.98, backgroundColor: "rgba(255,255,255,0.05)" }}
                                    key={u._id} 
                                    onClick={() => startChat(u._id)} 
                                    className="flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition w-full mb-1"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-[52px] h-[52px] bg-gray-800 rounded-full flex-shrink-0 overflow-hidden shadow-lg border border-white/10">
                                            {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[22px] bg-[#0F0F14]">😎</div>}
                                        </div>
                                        {onlineUsers.includes(u._id) && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00E5FF] border-[2px] border-[#16161D] rounded-full shadow-[0_0_8px_#00E5FF]"></div>}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[16px] text-white tracking-tight">{u.displayName || u.username}</h3>
                                        <p className="text-[#00E5FF]/70 text-[13px] font-semibold mt-0.5">@{u.username}</p>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="flex flex-col items-center justify-center pt-10 text-center opacity-70">
                                    <UserPlus size={48} className="text-white/20 mb-4" />
                                    <p className="text-white font-bold text-[17px]">No matches found</p>
                                </div>
                            );
                            })()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatList;
