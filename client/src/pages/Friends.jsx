import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Search, UserPlus, Check, X, Clock, Users, UserCheck } from 'lucide-react';

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
            // Update local state to reflect 'sent'
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
            // Also add to friends implicitly because we accepted
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
        <div className="flex flex-col h-full w-full bg-[#F8F9FA] font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-white px-5 py-4 z-10 sticky top-0 shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 mb-5">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition shrink-0">
                        <ChevronLeft size={28} className="text-gray-800" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex-1">Connections</h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full relative">
                    <button onClick={() => setActiveTab('add')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-200 z-10 ${activeTab === 'add' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Discover</button>
                    <button onClick={() => setActiveTab('requests')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-200 relative z-10 ${activeTab === 'requests' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        Requests
                        {friendRequests.length > 0 && activeTab !== 'requests' && (
                            <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border border-gray-100"></span>
                        )}
                        {friendRequests.length > 0 && activeTab === 'requests' && (
                            <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('friends')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-200 z-10 ${activeTab === 'friends' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>My Friends</button>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto w-full px-4 pt-6 pb-20 scrollbar-hide">

                {activeTab === 'add' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center px-4 h-14 mb-6 border border-gray-100 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                            <Search size={22} className="text-gray-400 mr-3" strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Search by name or username..."
                                className="flex-1 bg-transparent outline-none font-semibold text-gray-800 placeholder-gray-400 text-[15px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            {loading && searchResults.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 font-medium animate-pulse">Searching the network...</div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(user => (
                                    <div key={user._id} className="bg-white rounded-2xl p-3.5 flex items-center justify-between border border-gray-50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition min-w-0">
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer pr-2">
                                            <div className="w-[54px] h-[54px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                                                {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : <div className="text-2xl">😎</div>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-extrabold text-[16px] text-gray-900 tracking-tight truncate">{user.displayName || user.username}</h3>
                                                <p className="text-gray-500 text-[13px] font-semibold truncate mt-0.5">@{user.username}</p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 pl-2">
                                            {user.status === 'none' && (
                                                <button onClick={() => sendRequest(user._id)} className="bg-[#0099FF] hover:bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-sm transition shadow-sm shadow-blue-200 flex items-center gap-1.5 active:scale-95">
                                                    <UserPlus size={16} strokeWidth={2.5} /> Add
                                                </button>
                                            )}
                                            {user.status === 'sent' && (
                                                <button disabled className="bg-gray-100 text-gray-500 px-5 py-2 rounded-full font-bold text-sm flex items-center gap-1.5 cursor-default">
                                                    <Clock size={16} strokeWidth={2.5} /> Pending
                                                </button>
                                            )}
                                            {user.status === 'received' && (
                                                <button onClick={() => acceptRequest(user._id)} className="bg-[#00A884] hover:bg-green-600 text-white px-5 py-2 rounded-full font-bold text-sm transition shadow-sm shadow-green-200 flex items-center gap-1.5 active:scale-95">
                                                    <Check size={16} strokeWidth={3} /> Accept
                                                </button>
                                            )}
                                            {user.status === 'friend' && (
                                                <button onClick={() => startChat(user._id)} className="bg-white border-2 border-gray-200 text-gray-800 px-5 py-1.5 rounded-full font-bold text-sm transition shadow-sm active:scale-95 hover:bg-gray-50">
                                                    Chat
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : searchQuery ? (
                                <div className="p-10 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-gray-100 border-dashed mt-4 shadow-sm">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                        <Search size={30} strokeWidth={2} />
                                    </div>
                                    <p className="text-gray-800 font-bold text-lg mb-1">No matches found</p>
                                    <p className="text-gray-400 text-sm font-medium">Try searching for a different name or username.</p>
                                </div>
                            ) : (
                                <div className="p-10 flex flex-col items-center justify-center text-center bg-transparent mt-4">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mb-5 border border-blue-100 text-blue-400 shadow-inner">
                                        <Users size={34} strokeWidth={2} />
                                    </div>
                                    <p className="text-gray-800 font-extrabold text-xl mb-2">Find Your Squad</p>
                                    <p className="text-gray-500 text-[15px] font-medium max-w-[250px] leading-relaxed">Search for friends on VibeChat to start sharing moments together.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-3">
                        {friendRequests.length > 0 ? (
                            friendRequests.map(user => (
                                <div key={user._id} className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-50 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition min-w-0">
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                                        <div className="w-[56px] h-[56px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                                            {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : <div className="text-2xl">😎</div>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-extrabold text-[16px] text-gray-900 tracking-tight truncate">{user.displayName || user.username}</h3>
                                            <p className="text-[#0099FF] text-[13px] font-bold mt-0.5 truncate tracking-wide">NEW FRIEND REQUEST</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2 pl-2">
                                        <button className="w-[42px] h-[42px] bg-gray-100 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-200 transition active:scale-95">
                                            <X size={22} strokeWidth={2.5} />
                                        </button>
                                        <button onClick={() => acceptRequest(user._id)} className="w-[42px] h-[42px] bg-[#0099FF] text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition shadow-md shadow-blue-200 active:scale-95">
                                            <Check size={22} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 flex flex-col items-center justify-center text-center mt-8">
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                                        <UserPlus size={40} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <p className="text-gray-800 font-extrabold text-2xl mb-2 tracking-tight">You're all caught up!</p>
                                <p className="text-gray-500 text-[15px] font-medium max-w-[250px] leading-relaxed">When someone sends you a friend request, it will appear here.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'friends' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-3">
                        {myFriends.length > 0 ? (
                            myFriends.map(user => (
                                <div key={user._id} className="bg-white rounded-2xl p-3.5 flex items-center justify-between border border-gray-50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition min-w-0">
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                                        <div className="w-[50px] h-[50px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                                            {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : <div className="text-xl">😎</div>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-extrabold text-[16px] text-gray-900 tracking-tight truncate">{user.displayName || user.username}</h3>
                                            <p className="text-gray-400 text-[13px] font-semibold truncate mt-0.5">@{user.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 pl-2">
                                        <button onClick={() => startChat(user._id)} className="bg-[#EFEAE2] hover:bg-[#e4dfd6] text-gray-800 px-5 py-2 rounded-full font-bold text-sm transition shadow-sm active:scale-95 border border-transparent">
                                            Chat
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 flex flex-col items-center justify-center text-center mt-8">
                                <div className="w-24 h-24 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-full flex items-center justify-center mb-6 text-purple-400 shadow-inner">
                                    <UserCheck size={44} strokeWidth={1.5} />
                                </div>
                                <p className="text-gray-800 font-extrabold text-2xl mb-2 tracking-tight">No Friends Yet</p>
                                <p className="text-gray-500 text-[15px] font-medium max-w-[250px] leading-relaxed">Head over to the Discover tab to find people you know!</p>
                                <button onClick={() => setActiveTab('add')} className="mt-8 px-8 py-3.5 bg-gray-900 text-white font-bold rounded-full hover:bg-gray-800 transition shadow-lg active:scale-95">
                                    Discover Friends
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;
