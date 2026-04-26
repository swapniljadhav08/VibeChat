import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Search, Send, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const SendToModal = ({ onClose, onSend, isUploading }) => {
    const { authToken } = useAuth();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);

    useEffect(() => {
        const fetchFriends = async () => {
            if (!authToken) return;
            try {
                // chat/users returns friends of the current user for starting chats
                const res = await axios.get(`${API_BASE_URL}/api/chat/users`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                setFriends(res.data.users || []);
            } catch (error) {
                console.error("Error fetching friends:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFriends();
    }, [authToken]);

    const toggleFriend = (id) => {
        if (selectedFriends.includes(id)) {
            setSelectedFriends(selectedFriends.filter(f => f !== id));
        } else {
            setSelectedFriends([...selectedFriends, id]);
        }
    };

    const handleSendClick = () => {
        if (selectedFriends.length === 0) {
            toast.error("Please select at least one friend.");
            return;
        }
        onSend(selectedFriends);
    };

    const filteredFriends = (() => {
        const q = searchQuery.toLowerCase();
        return friends.filter(f =>
            f.displayName?.toLowerCase().includes(q) ||
            f.username?.toLowerCase().includes(q)
        );
    })();

    return (
        <div className="absolute inset-0 bg-[#0F0F14] z-[60] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 text-white font-sans overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-[10%] left-[-20%] w-[60%] h-[50%] bg-[#7F5AF0]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-[#00E5FF]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 border-b border-white/5 bg-[#0F0F14]/70 backdrop-blur-2xl shadow-lg sticky top-0 z-20 shrink-0">
                <div className="flex items-center gap-3 w-full">
                    <button onClick={onClose} disabled={isUploading} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition shrink-0 active:scale-95">
                        <ChevronLeft size={28} className="text-white/80 hover:text-white" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight flex-1">Send Snap To...</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col pt-3 pb-24 hide-scrollbar scrollbar-hide z-10 relative">

                {/* Selected Count bubbles */}
                {selectedFriends.length > 0 && (
                    <div className="px-5 py-2 flex items-center overflow-x-auto hide-scrollbar scrollbar-hide gap-2 shrink-0">
                        {selectedFriends.map(targetId => {
                            const friend = friends.find(f => f._id === targetId);
                            if (!friend) return null;
                            return (
                                <div key={targetId} onClick={() => toggleFriend(targetId)} className="flex items-center gap-1.5 bg-gradient-to-r from-[#7F5AF0]/20 to-[#00E5FF]/20 border border-white/10 text-white px-3 py-1.5 rounded-full font-bold text-sm cursor-pointer hover:border-white/20 transition shrink-0 shadow-sm">
                                    <span>{friend.displayName || friend.username}</span>
                                    <span className="text-[#00E5FF] rounded-full p-0.5"><X size={12} strokeWidth={3} /></span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="px-4 mb-2 mt-1">
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl flex items-center px-4 h-12 shadow-inner border border-white/10 focus-within:border-[#00E5FF]/50 transition-all">
                        <Search size={20} className="text-white/40 mr-2" strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="Find friends..."
                            className="flex-1 bg-transparent outline-none font-medium text-white placeholder-white/40 text-[15px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="px-2 mt-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-8 gap-4 text-white/50">
                            <div className="w-8 h-8 border-4 border-[#7F5AF0]/30 border-t-[#00E5FF] rounded-full animate-spin shadow-[0_0_15px_#00E5FF]"></div>
                            <p className="font-semibold tracking-wide text-sm">Loading friends...</p>
                        </div>
                    ) : friends.length === 0 ? (
                        <div className="text-center p-10 flex flex-col items-center opacity-70">
                            <h3 className="font-extrabold text-white text-lg mb-2">No friends yet.</h3>
                            <p className="text-white/50 font-medium text-sm">Add friends to send them snaps!</p>
                        </div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-xl rounded-[24px] shadow-sm border border-white/10 overflow-hidden mx-2 pb-1">
                            <h3 className="px-4 py-2.5 text-[12px] font-extrabold text-white/40 uppercase tracking-widest bg-white/5 border-b border-white/5">Best Friends</h3>
                            {filteredFriends.map(user => {
                                const isSelected = selectedFriends.includes(user._id);
                                return (
                                    <div
                                        key={user._id}
                                        onClick={() => toggleFriend(user._id)}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition border-b border-white/5 last:border-0 ${isSelected ? 'bg-[#7F5AF0]/20' : 'hover:bg-white/5 active:bg-white/10'}`}
                                    >
                                        <div className={`w-[46px] h-[46px] rounded-full flex-shrink-0 overflow-hidden border ${isSelected ? 'border-[#00E5FF] shadow-[0_0_10px_#00E5FF]' : 'border-white/10'} relative bg-gray-800 transition-all`}>
                                            {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl bg-[#0F0F14]">😎</div>}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="font-bold text-[16px] text-white tracking-tight truncate">{user.displayName || user.username}</h3>
                                            <p className="text-[#00E5FF]/70 text-[13px] font-semibold mt-0.5 truncate">@{user.username}</p>
                                        </div>

                                        {/* Custom Checkbox */}
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#00E5FF] border-[#00E5FF] shadow-[0_0_10px_#00E5FF]' : 'border-white/20'}`}>
                                            {isSelected && <Check size={14} className="text-[#0F0F14]" strokeWidth={3} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Floating Action Button */}
            {selectedFriends.length > 0 && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center w-full px-6 z-20 pb-safe slide-in-from-bottom-4 animate-in duration-300">
                    <button
                        onClick={handleSendClick}
                        disabled={isUploading}
                        className={`w-full max-w-sm flex items-center justify-center space-x-2 bg-gradient-to-r from-[#7F5AF0] to-[#00E5FF] text-white h-[56px] rounded-full font-extrabold text-[17px] tracking-wide transition shadow-[0_8px_30px_rgba(127,90,240,0.5)] border border-white/20 ${isUploading ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}`}
                    >
                        <span>{isUploading ? 'Sending...' : `Send to ${selectedFriends.length}`}</span>
                        {!isUploading && <Send size={20} className="ml-1" strokeWidth={2.5} />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SendToModal;
