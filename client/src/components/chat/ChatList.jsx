import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, MessageSquarePlus, Search, Camera, UserPlus } from 'lucide-react';

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
            // If token is missing, set a timeout to stop loading and show an error/empty state
            const fallbackTimer = setTimeout(() => {
                setLoading(false);
            }, 5000); // give it 5 seconds maximum
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

    return (
        <div className="h-full w-full bg-white text-black overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100 z-10 w-full shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition shrink-0 md:hidden">
                        <ChevronLeft size={30} className="text-gray-800" strokeWidth={2.5} />
                    </button>
                    <div onClick={() => navigate('/profile')} className="w-[36px] h-[36px] rounded-full bg-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition shrink-0 flex items-center justify-center shadow-sm">
                        {userData?.photoURL || currentUser?.photoURL ? (
                            <img src={userData?.photoURL || currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg">👻</span>
                        )}
                    </div>
                    <div className="flex items-center justify-center w-[36px] h-[36px] bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition">
                        <Search size={20} className="text-gray-600" strokeWidth={2.5} />
                    </div>
                </div>
                <h1 className="text-[20px] font-extrabold text-black tracking-tight absolute left-1/2 transform -translate-x-1/2">Chat</h1>
                <div className="flex items-center gap-3">
                    <div onClick={() => navigate('/')} className="flex items-center justify-center w-[36px] h-[36px] bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition text-gray-700 hover:text-[#0099FF]" title="Return to Camera">
                        <Camera size={20} strokeWidth={2} />
                    </div>
                    <div onClick={fetchUsers} className="flex items-center justify-center w-[36px] h-[36px] bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition" title="Start New Chat">
                        <MessageSquarePlus size={20} className="text-gray-700" strokeWidth={2} />
                    </div>
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto w-full bg-white scrollbar-hide relative">
                {showNewChat ? (
                    <div className="absolute inset-x-0 bottom-0 h-[95%] z-50 bg-white rounded-t-[32px] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 animate-in slide-in-from-bottom border-t border-gray-100">
                        {/* Notch Handle for premium feel */}
                        <div className="w-full flex justify-center pt-3 pb-2 shrink-0">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                        </div>

                        {/* Header for New Chat */}
                        <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-gray-100 bg-white shrink-0">
                            <h2 className="text-[22px] font-extrabold text-black tracking-tight">New Chat</h2>
                            <button onClick={() => setShowNewChat(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition active:scale-90 text-gray-600">
                                <ChevronLeft size={24} strokeWidth={2.5} className="rotate-180" /> {/* Close / Down icon visual */}
                            </button>
                        </div>

                        {/* Premium 'Add New Friend' Action Card */}
                        <div className="px-5 pt-5 pb-4 shrink-0">
                            <div
                                onClick={() => navigate('/friends')}
                                className="w-full relative overflow-hidden flex items-center p-4 bg-gradient-to-br from-[#0099FF] to-[#0077FF] rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98] group"
                            >
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                                <div className="bg-white/20 p-3 rounded-xl mr-4 backdrop-blur-sm border border-white/20 shadow-sm">
                                    <UserPlus size={24} className="text-white" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold text-[17px] tracking-tight mb-0.5">Add New Friends</h3>
                                    <p className="text-white/80 font-medium text-[13px] leading-tight">Grow your network to start chatting</p>
                                </div>
                                <div className="bg-white text-[#0099FF] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">Find</div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="px-5 pb-3">
                            <div className="bg-gray-50 rounded-2xl flex items-center px-4 h-12 shadow-sm border border-gray-200/50 focus-within:border-[#0099FF]/40 focus-within:bg-white transition-colors focus-within:shadow-blue-500/5">
                                <Search size={20} className="text-gray-400 mr-2.5" strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Search your friends..."
                                    className="flex-1 bg-transparent outline-none font-semibold text-black placeholder-gray-400 text-[15px]"
                                    value={searchFriendQuery}
                                    onChange={(e) => setSearchFriendQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Your Friends List */}
                        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
                            <div className="px-5 py-2">
                                <h3 className="text-[13px] font-extrabold text-gray-400 uppercase tracking-widest pl-1 mb-2">My Friends</h3>
                            </div>

                            {(() => {
                                const q = searchFriendQuery.toLowerCase();
                                const filtered = users.length > 0 ? users.filter(u => u.displayName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)) : [];
                                return filtered.length > 0 ? filtered.map((u, i) => (
                                <div key={u._id} onClick={() => startChat(u._id)} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition w-full group">
                                    <div className="relative shrink-0">
                                        <div className="w-[52px] h-[52px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex-shrink-0 overflow-hidden shadow-sm border border-white group-hover:shadow-md transition-shadow">
                                            {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[22px]">😎</div>}
                                        </div>
                                        {onlineUsers.includes(u._id) && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white rounded-full shadow-sm"></div>}
                                    </div>
                                    <div className="border-b border-gray-100/60 pb-3 flex-1 pt-1.5 group-last:border-transparent">
                                        <h3 className="font-bold text-[16px] text-gray-900 tracking-tight leading-tight">{u.displayName || u.username}</h3>
                                        <p className="text-gray-500 text-[13px] font-medium leading-tight mt-0.5">@{u.username}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center pt-8 text-center px-8">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100 shadow-sm">
                                        <UserPlus size={36} className="text-gray-400" strokeWidth={1.5} />
                                    </div>
                                    <p className="mb-2 text-black font-extrabold text-[19px] tracking-tight">No Friends Yet</p>
                                    <p className="text-gray-500 font-medium text-[15px] mb-8 leading-relaxed max-w-[240px]">Once you add friends, they'll appear here for you to chat with.</p>
                                    <button onClick={() => navigate('/friends')} className="px-8 py-3.5 bg-black text-white font-bold text-[15px] rounded-full hover:bg-gray-800 transition shadow-lg active:scale-95 w-full max-w-[200px]">
                                        Find Friends
                                    </button>
                                </div>
                            );
                            })()}
                        </div>
                    </div>
                ) : (
                    <div>
                        {loading ? (
                            <p className="p-8 text-center text-gray-400 font-medium">Loading chats...</p>
                        ) : chats && chats.length > 0 ? (
                            chats.map(chat => {
                                const otherParticipant = chat.participants.find(p => String(p._id) !== String(userData?._id)) || chat.participants[0];
                                const isParticipantOnline = otherParticipant?._id && onlineUsers.includes(otherParticipant._id);
                                const isNewChat = !chat.lastMessage?.text;

                                return (
                                    <div key={chat._id} onClick={() => navigate(`/chat/${chat._id}`)} className="flex items-center pl-3 hover:bg-gray-50 cursor-pointer transition w-full active:bg-gray-100">
                                        <div className="relative mr-3 flex-shrink-0">
                                            <div className="w-[54px] h-[54px] bg-gray-200 rounded-full overflow-hidden">
                                                {otherParticipant?.photoURL ? <img src={otherParticipant.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-yellow-100 to-yellow-300">😎</div>}
                                            </div>
                                            {isParticipantOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                                        </div>
                                        <div className="flex-1 min-w-0 border-b border-gray-100 py-3 pr-4 flex justify-between items-center h-full">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h3 className="font-bold text-[18px] text-black truncate tracking-tight">{otherParticipant?.displayName || otherParticipant?.username || 'Unknown'}</h3>
                                                <p className="text-[14px] truncate flex items-center gap-[6px] mt-[1px]">
                                                    {isNewChat ? (
                                                        <>
                                                            <span className="w-[10px] h-[10px] rounded-[3px] bg-[#0099FF] inline-block flex-shrink-0 drop-shadow-sm"></span>
                                                            <span className="font-semibold text-[#0099FF]">New Chat</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className={`w-[11px] h-[11px] rounded-[3px] border-[2px] inline-block flex-shrink-0 ${chat.lastMessage?.senderId?._id === userData?._id || chat.lastMessage?.senderId === userData?._id ? 'border-gray-400' : 'border-[#0099FF] bg-[#0099FF]'}`}></span>
                                                            <span className={`font-medium truncate max-w-[150px] ${chat.lastMessage?.senderId?._id === userData?._id || chat.lastMessage?.senderId === userData?._id ? 'text-gray-500' : 'text-black font-semibold'}`}>
                                                                {chat.lastMessage?.text || 'Sent a message'}
                                                            </span>
                                                            <span className="text-gray-300 font-medium text-[10px]">●</span>
                                                            <span className="text-gray-400 font-medium text-[13px]">{formatTimestamp(chat.lastMessage?.timestamp)}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center pl-4 border-l border-gray-100 h-[30px]">
                                                <Camera size={26} className="text-gray-300 hover:text-gray-400 transition-colors" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-24 text-center">
                                <div className="w-24 h-24 mb-6 opacity-30">
                                    <MessageSquarePlus size={96} className="text-gray-500" />
                                </div>
                                <p className="mb-6 text-gray-500 font-medium text-lg">No chats yet.</p>
                                <button onClick={fetchUsers} className="px-8 py-3 bg-[#0099FF] text-white font-bold rounded-full hover:bg-blue-600 transition shadow-sm active:scale-95">
                                    Start a Chat
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;
