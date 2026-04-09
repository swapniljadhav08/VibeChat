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
        <div className="absolute inset-0 bg-[#FAFAFA] z-[60] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100 bg-white shadow-sm sticky top-0 shrink-0">
                <div className="flex items-center gap-3 w-full">
                    <button onClick={onClose} disabled={isUploading} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition shrink-0 active:scale-95">
                        <ChevronLeft size={28} className="text-gray-800" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-extrabold text-black tracking-tight flex-1">Send Snap To...</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col pt-3 pb-24 scrollbar-hide">

                {/* Selected Count bubbles (Optional visual feedback) */}
                {selectedFriends.length > 0 && (
                    <div className="px-5 py-2 flex items-center overflow-x-auto scrollbar-hide gap-2 shrink-0">
                        {selectedFriends.map(targetId => {
                            const friend = friends.find(f => f._id === targetId);
                            if (!friend) return null;
                            return (
                                <div key={targetId} onClick={() => toggleFriend(targetId)} className="flex items-center gap-1.5 bg-[#0099FF]/10 text-[#0099FF] px-3 py-1.5 rounded-full font-bold text-sm cursor-pointer hover:bg-[#0099FF]/20 transition shrink-0">
                                    <span>{friend.displayName || friend.username}</span>
                                    <span className="text-[#0099FF] rounded-full p-0.5"><X size={12} strokeWidth={3} /></span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="px-4 mb-2">
                    <div className="bg-gray-100 rounded-xl flex items-center px-4 h-11 shadow-inner border border-gray-200/50 focus-within:ring-2 focus-within:ring-[#0099FF]/30 transition-all">
                        <Search size={20} className="text-gray-400 mr-2" strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="Find friends..."
                            className="flex-1 bg-transparent outline-none font-semibold text-gray-800 placeholder-gray-500 text-[15px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="px-2 mt-2">
                    {loading ? (
                        <p className="p-8 text-center text-gray-400 font-bold animate-pulse">Loading friends...</p>
                    ) : friends.length === 0 ? (
                        <div className="text-center p-10 flex flex-col items-center">
                            <h3 className="font-extrabold text-gray-800 text-lg mb-2">No friends yet.</h3>
                            <p className="text-gray-500 font-medium text-sm">Add friends to send them snaps!</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden mx-2">
                            <h3 className="px-4 py-2 text-[12px] font-extrabold text-gray-400 uppercase tracking-widest bg-gray-50">Best Friends</h3>
                            {filteredFriends.map(user => {
                                const isSelected = selectedFriends.includes(user._id);
                                return (
                                    <div
                                        key={user._id}
                                        onClick={() => toggleFriend(user._id)}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition border-b border-gray-50 last:border-0 ${isSelected ? 'bg-[#0099FF]/5' : 'hover:bg-gray-50 active:bg-gray-100'}`}
                                    >
                                        <div className="w-[46px] h-[46px] bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border border-gray-100 relative">
                                            {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-yellow-100 to-yellow-300">😎</div>}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="font-extrabold text-[16px] text-gray-900 tracking-tight truncate">{user.displayName || user.username}</h3>
                                            <p className="text-gray-500 text-[13px] font-medium mt-0.5 truncate">@{user.username}</p>
                                        </div>

                                        {/* Custom Checkbox */}
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300'}`}>
                                            {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
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
                <div className="absolute bottom-6 left-0 right-0 flex justify-center w-full px-6 z-20 slide-in-from-bottom-4 animate-in duration-300">
                    <button
                        onClick={handleSendClick}
                        disabled={isUploading}
                        className={`w-full max-w-sm flex items-center justify-center space-x-2 bg-snapYellow hover:bg-[#fffc00] text-black h-14 rounded-full font-extrabold text-lg transition shadow-xl border border-yellow-300 ${isUploading ? 'opacity-70 cursor-wait' : 'active:scale-95'}`}
                    >
                        <span>{isUploading ? 'Sending...' : `Send to ${selectedFriends.length}`}</span>
                        {!isUploading && <Send size={20} strokeWidth={2.5} />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SendToModal;
