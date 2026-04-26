import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ChevronLeft, Send, Camera, Image as ImageIcon, Trash2, Phone, Video, MoreVertical, Search, Shield, Ban, Check, CheckCheck, Plus, File as FileIcon, Mic, Smile, X, Sparkles, Play, Pause } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ChatRoom = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { authToken, currentUser, userData } = useAuth();
    const { startCall } = useNotifications();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [participantName, setParticipantName] = useState('Loading...');
    const [participantPhoto, setParticipantPhoto] = useState(null);
    const [participantId, setParticipantId] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const dropdownRef = useRef(null);

    const [viewingSnap, setViewingSnap] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileDocRef = useRef(null);

    // Audio recording features
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const [showAISuggestions, setShowAISuggestions] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        }
    }, []);

    const openSnap = (msg) => {
        setViewingSnap(msg);
        socketRef.current.emit('message_opened', { messageId: msg._id, chatId });

        setTimeout(() => {
            setViewingSnap((prev) => {
                if (prev && prev._id === msg._id) {
                    return null;
                }
                return prev;
            });
        }, 10000);
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!authToken) return;

        const fetchMessages = async () => {
            try {
                const chatRes = await axios.get(`${API_BASE_URL}/api/chat`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                const currentChat = chatRes.data.chats.find(c => c._id === chatId);
                if (currentChat && userData) {
                    const other = currentChat.participants.find(p => p._id !== userData._id);
                    if (other) {
                        setParticipantName(other.displayName || other.username || 'Unknown');
                        setParticipantPhoto(other.photoURL);
                        setParticipantId(other._id);
                    }
                }

                const res = await axios.get(`${API_BASE_URL}/api/chat/${chatId}/messages`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                setMessages(res.data.messages || []);

                res.data.messages?.forEach(msg => {
                    if (msg.messageType === 'text' && msg.status !== 'read') {
                        const sId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                        if (sId !== userData._id) {
                            setTimeout(() => {
                                if (socketRef.current) socketRef.current.emit('message_opened', { messageId: msg._id, chatId });
                            }, 500);
                        }
                    }
                });
            } catch (error) {
                console.error("Error fetching messages", error);
            }
        };

        fetchMessages();

        socketRef.current = io(API_BASE_URL);
        socketRef.current.emit('join_room', chatId);
        if (userData) {
            socketRef.current.emit('register_user', userData._id);
        }

        socketRef.current.on('online_users', (users) => {
            setOnlineUsers(users);
        });

        socketRef.current.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
            const sId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
            if (sId !== userData._id && msg.messageType === 'text') {
                socketRef.current.emit('message_opened', { messageId: msg._id, chatId });
            }
        });

        socketRef.current.on('user_typing', ({ senderId }) => {
            if (senderId !== userData._id) {
                setIsTyping(true);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
            }
        });

        socketRef.current.on('message_deleted', (deletedId) => {
            setMessages((prev) => prev.filter(m => m._id !== deletedId));
        });

        socketRef.current.on('message_status_update', ({ messageId, status, content }) => {
            setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, status, content: content !== undefined ? content : m.content } : m));
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [chatId, authToken, currentUser, userData]);

    const handleSendMessage = (contentToSend = newMessage) => {
        if (typeof contentToSend !== 'string') contentToSend = newMessage; // protect event args vs string explicitly passed

        if (!contentToSend.trim() || !userData) return;

        const msgData = {
            chatId,
            senderId: userData._id,
            messageType: 'text',
            content: contentToSend,
            expiresIn: 0
        };

        socketRef.current.emit('send_message', msgData);
        if (contentToSend === newMessage) setNewMessage('');
        setShowEmojiPicker(false);
        setShowPlusMenu(false);
        setShowAISuggestions(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && userData) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const res = await axios.post(`${API_BASE_URL}/api/upload/snap`, {
                        imageBase64: reader.result
                    }, { headers: { Authorization: `Bearer ${authToken}` } });

                    socketRef.current.emit('send_message', {
                        chatId,
                        senderId: userData._id,
                        messageType: 'image',
                        content: res.data.url,
                        expiresIn: 10
                    });
                    setShowPlusMenu(false);
                } catch (error) {
                    console.error("Upload failed", error);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocUpload = (e) => {
        const file = e.target.files[0];
        if (file && userData) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const res = await axios.post(`${API_BASE_URL}/api/upload/snap`, {
                        imageBase64: reader.result
                    }, { headers: { Authorization: `Bearer ${authToken}` } });

                    socketRef.current.emit('send_message', {
                        chatId,
                        senderId: userData._id,
                        messageType: 'document',
                        content: res.data.url,
                        expiresIn: 0
                    });
                    setShowPlusMenu(false);
                } catch (error) {
                    console.error("Document Upload failed", error);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEmojiClick = (emojiData) => {
        setNewMessage((prev) => prev + emojiData.emoji);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        const res = await axios.post(`${API_BASE_URL}/api/upload/snap`, {
                            imageBase64: reader.result
                        }, { headers: { Authorization: `Bearer ${authToken}` } });

                        socketRef.current.emit('send_message', {
                            chatId,
                            senderId: userData._id,
                            messageType: 'audio',
                            content: res.data.url,
                            expiresIn: 0
                        });
                    } catch (error) {
                        console.error("Audio Upload failed", error);
                    }
                };
                reader.readAsDataURL(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);

        } catch (error) {
            alert('Cannot access microphone. Check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            audioChunksRef.current = [];
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
        }
    };

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const deleteChat = async () => {
        if (window.confirm("Delete this conversation permanently?")) {
            try {
                await axios.delete(`${API_BASE_URL}/api/chat/${chatId}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                navigate('/chat');
            } catch (error) {
                console.error("Failed to delete chat", error);
            }
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (e.target.value.length > 5 && !showAISuggestions) {
            // Trigger AI suggestions mock
            setShowAISuggestions(Math.random() > 0.5); 
        } else if (e.target.value.length === 0) {
            setShowAISuggestions(false);
        }

        if (userData) {
            socketRef.current.emit('start_typing', { chatId, senderId: userData._id });
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit('stop_typing', { chatId, senderId: userData._id });
            }, 1000);
        }
    };

    const suggestionChips = ["Just a sec! ✨", "Sounds good to me 👍", "Can we do tomorrow?"];

    return (
        <div className="flex flex-col h-full w-full bg-[#0F0F14] relative font-sans overflow-hidden text-white">
            
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

            {/* Premium Fullscreen Snap View */}
            <AnimatePresence>
                {viewingSnap && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-[#0F0F14]/90 flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => setViewingSnap(null)}
                    >
                        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
                            <span className="text-white font-extrabold text-[18px] drop-shadow-md">{participantName}</span>
                            <div className="w-10 h-10 border-2 border-[#00E5FF] rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-[#00E5FF] font-bold text-[14px]">10s</span>
                            </div>
                        </div>
                        <motion.img 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            src={viewingSnap.content} 
                            alt="Snap" 
                            className="w-full h-full object-contain rounded-xl shadow-[0_0_50px_rgba(127,90,240,0.5)]" 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Friend Profile Modal Setup (Dark Glass) */}
            <AnimatePresence>
                {showProfile && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-[#0F0F14]/80 backdrop-blur-md flex flex-col items-center justify-end p-0 md:p-4"
                    >
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-[#16161D] w-full md:w-[400px] rounded-t-[40px] md:rounded-[40px] overflow-hidden flex flex-col items-center pt-10 pb-12 relative shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border border-white/5"
                        >
                            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 transition">
                                <X size={20} />
                            </button>
                            <div className="w-[140px] h-[140px] bg-gradient-to-tr from-[#7F5AF0] to-[#00E5FF] p-1 rounded-full shadow-[0_0_30px_rgba(127,90,240,0.4)] mb-4">
                                <div className="w-full h-full bg-[#0F0F14] rounded-full overflow-hidden">
                                    {participantPhoto ? <img src={participantPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl">😎</div>}
                                </div>
                            </div>
                            <h2 className="text-[26px] font-extrabold text-white tracking-tight drop-shadow-md">{participantName}</h2>
                            <p className="text-[#00E5FF] font-semibold mt-1 bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-4 py-1.5 rounded-full text-[13px] tracking-wide uppercase">Connection</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header (Glassmorphism + Neon) */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-white/5 bg-[#0F0F14]/70 backdrop-blur-2xl sticky top-0 z-20 w-full shrink-0 shadow-lg">
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate('/chat')} className="p-2 -ml-1 rounded-full hover:bg-white/10 transition shrink-0 md:hidden text-white/80">
                        <ChevronLeft size={30} strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-3" onClick={() => setShowProfile(true)}>
                        <div className="w-[44px] h-[44px] rounded-full bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.15)] ml-1 relative">
                            {participantPhoto ? <img src={participantPhoto} className="w-full h-full object-cover" /> : <div className="text-xl">😎</div>}
                            {(participantId && onlineUsers.includes(participantId)) && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00E5FF] border-[2px] border-[#0F0F14] rounded-full shadow-[0_0_8px_#00E5FF]"></div>
                            )}
                        </div>
                        <div className="flex flex-col justify-center cursor-pointer">
                            <h2 className="font-extrabold text-[17px] text-white leading-tight tracking-tight drop-shadow-sm">{participantName}</h2>
                            <p className="text-[12px] font-semibold text-white/40 leading-tight tracking-wide mt-0.5">
                                {isTyping ? (
                                    <span className="text-[#00E5FF] flex items-center gap-1">
                                        <span className="animate-bounce">.</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                                        typing
                                    </span>
                                ) : (participantId && onlineUsers.includes(participantId)) ? (
                                    <span className="text-[#00A884]">Online</span>
                                ) : (
                                    "Tap to view profile"
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Advanced Right Tools */}
                <div className="flex items-center gap-2 pr-1 relative" ref={dropdownRef}>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Sparkles onClick={() => alert("AI Context Trigger")} className="text-[#00E5FF] hover:bg-white/10 p-1.5 rounded-full cursor-pointer transition shadow-[#00E5FF]" size={34} strokeWidth={2.5} />
                    </motion.div>
                    <Phone onClick={() => startCall(chatId, participantName, participantPhoto, 'audio')} className="text-white/80 hover:bg-white/10 p-1.5 rounded-full cursor-pointer transition" size={34} strokeWidth={2} />
                    <Video onClick={() => startCall(chatId, participantName, participantPhoto, 'video')} className="text-white/80 hover:bg-white/10 p-1.5 rounded-full cursor-pointer transition" size={36} strokeWidth={2} />
                    <MoreVertical onClick={() => setShowDropdown(!showDropdown)} className="text-white/80 hover:bg-white/10 p-1 rounded-full cursor-pointer transition" size={32} strokeWidth={2} />

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute top-12 right-2 w-48 bg-[#1A1A24]/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 py-2 z-50 overflow-hidden text-white"
                            >
                                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition font-medium text-[14px]"><Search size={16} className="text-white/40" /> Search</div>
                                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition font-medium text-[14px]"><Trash2 size={16} className="text-white/40" /> Clear Chat</div>
                                <div onClick={() => { setShowDropdown(false); deleteChat(); }} className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 cursor-pointer transition text-red-500 font-medium text-[14px]"><Trash2 size={16} /> Delete Chat</div>
                                <div className="w-full h-px bg-white/5 my-1"></div>
                                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition font-medium text-[14px]"><Ban size={16} className="text-white/40" /> Block</div>
                                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 cursor-pointer transition text-red-500 font-medium text-[14px]"><Shield size={16} /> Report</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Immersive Message Area */}
            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1.5 hide-scrollbar scroll-smooth z-10 relative">
                {messages.map((msg, index) => {
                    const isMe = String(msg.senderId?._id || msg.senderId) === String(userData?._id);
                    const isFirstInGroup = index === 0 || String(messages[index - 1].senderId?._id || messages[index - 1].senderId) !== String(msg.senderId?._id || msg.senderId);

                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={msg._id || index} 
                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-[2px]'}`}
                        >
                            <div className={`relative max-w-[80%] px-4 py-2 text-[15px] shadow-sm backdrop-blur-md rounded-[20px] ${
                                isMe 
                                ? 'bg-gradient-to-br from-[#7F5AF0] to-[#00E5FF] text-white shadow-[0_4px_15px_rgba(127,90,240,0.2)] border border-white/10' 
                                : 'bg-[#1E1E2A]/80 text-[#EAEAEA] border border-white/5'
                            } ${isFirstInGroup ? (isMe ? 'rounded-tr-sm' : 'rounded-tl-sm') : ''}`}>

                                {msg.messageType === 'text' && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="whitespace-pre-wrap break-words leading-relaxed tracking-wide font-medium">{msg.content}</span>
                                        <div className="flex items-center gap-1.5 self-end text-[11px] font-semibold opacity-70">
                                            <span>{formatTime(msg.createdAt)}</span>
                                            {isMe && (
                                                <span className="flex">
                                                    {msg.status === 'read' ? <CheckCheck size={14} className="text-[#00E5FF]" /> : msg.status === 'delivered' ? <CheckCheck size={14} /> : <Check size={14} />}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {msg.messageType === 'image' && (
                                    <div className="flex flex-col cursor-pointer active:scale-95 transition-transform" onClick={() => { if (!isMe && msg.status !== 'read') openSnap(msg); }}>
                                        {isMe ? (
                                            <div className="flex items-center justify-between gap-5 py-0.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3.5 h-3.5 rounded-sm ${msg.status === 'read' ? 'border-2 border-white/80 bg-transparent' : 'bg-white shadow-[0_0_8px_white]'}`}></div>
                                                    <span className="font-bold tracking-wide text-[14px]">You Sent a Photo</span>
                                                </div>
                                                <span className="text-[11px] opacity-70 flex items-center gap-1">{formatTime(msg.createdAt)} {msg.status === 'read' ? <CheckCheck size={14}/> : <Check size={14}/>}</span>
                                            </div>
                                        ) : msg.status === 'read' ? (
                                            <div className="flex flex-col py-0.5">
                                                <div className="flex items-center gap-2 text-white/50">
                                                    <div className="w-3.5 h-3.5 border-2 border-red-500 rounded-sm bg-transparent"></div>
                                                    <span className="font-semibold italic text-[14px]">Opened Photo</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-6 pl-2 pr-4 py-2.5 bg-red-500 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 bg-white rounded-sm animate-pulse"></div>
                                                    <span className="font-extrabold text-[15px] tracking-wide text-white">New Snap!</span>
                                                </div>
                                                <span className="text-[11px] font-bold opacity-80">Tap to view</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {msg.messageType === 'audio' && (
                                    <div className="flex flex-col min-w-[180px]">
                                        <div className="flex items-center gap-3 bg-black/20 rounded-xl p-2 border border-white/10">
                                            <button className="w-8 h-8 bg-white text-[#7F5AF0] rounded-full flex items-center justify-center shrink-0">
                                                <Play size={16} className="ml-0.5" />
                                            </button>
                                            <div className="flex-1 flex gap-0.5 items-center h-4">
                                                {/* Mock Waveform UI */}
                                                {[...Array(12)].map((_, i) => (
                                                    <div key={i} className="w-1.5 bg-white/50 rounded-full" style={{ height: `${Math.random() * 100 + 10}%` }}></div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-1 text-[11px] font-semibold opacity-70 px-1">
                                            <span>{formatTime(msg.createdAt)}</span>
                                            {isMe && <span>{msg.status === 'read' ? <CheckCheck size={14} className="text-[#00E5FF]" /> : <Check size={14} />}</span>}
                                        </div>
                                    </div>
                                )}

                                {msg.messageType === 'document' && (
                                    <div className="flex flex-col">
                                        <a href={msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/20 rounded-xl hover:bg-black/30 transition cursor-pointer border border-white/10">
                                            <FileIcon size={26} className="text-white" />
                                            <span className="font-bold text-[14px] underline underline-offset-4 tracking-wide text-white">Attachment Docs</span>
                                        </a>
                                        <div className="flex items-center justify-between mt-1 text-[11px] font-semibold opacity-70 px-1">
                                            <span>{formatTime(msg.createdAt)}</span>
                                            {isMe && <span>{msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Smart Input Area */}
            <div className="relative z-20 pb-4">
                
                {/* AI Chips Overlay */}
                <AnimatePresence>
                    {showAISuggestions && (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                            className="absolute bottom-full left-0 w-full px-4 mb-2 flex gap-2 overflow-x-auto hide-scrollbar z-40"
                        >
                            {suggestionChips.map((chip, idx) => (
                                <button key={idx} onClick={() => handleSendMessage(chip)} className="px-4 py-2 bg-[#7F5AF0]/30 hover:bg-[#7F5AF0]/50 backdrop-blur-xl border border-[#7F5AF0]/50 rounded-full text-white text-[13px] font-bold shadow-[0_0_15px_rgba(127,90,240,0.3)] shrink-0 whitespace-nowrap transition-colors">
                                    {chip}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-50 w-full shadow-2xl border-t border-white/10 bg-[#0F0F14]">
                        <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" height={350} width="100%" />
                    </div>
                )}

                <AnimatePresence>
                    {showPlusMenu && (
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 10 }} className="absolute bottom-full left-4 mb-3 bg-[#1A1A24]/95 backdrop-blur-2xl rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] border border-white/10 p-2 z-50 flex flex-col gap-1 w-48 text-white">
                            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition font-bold text-[15px] cursor-pointer"><div className="w-10 h-10 bg-[#00E5FF]/20 text-[#00E5FF] rounded-full flex items-center justify-center"><ImageIcon size={20} /></div>Photo</button>
                            <button onClick={() => fileDocRef.current.click()} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition font-bold text-[15px] cursor-pointer"><div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center"><FileIcon size={20} /></div>Document</button>
                            <button onClick={() => navigate('/')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition font-bold text-[15px] cursor-pointer"><div className="w-10 h-10 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center"><Camera size={20} /></div>Camera</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Bar */}
                <div className="px-3 pt-2 bg-gradient-to-t from-[#0F0F14] to-[#0F0F14]/80 flex items-end gap-2 text-white">
                    <button type="button" onClick={() => { setShowPlusMenu(!showPlusMenu); setShowEmojiPicker(false); }} className="p-2.5 rounded-full text-white hover:bg-white/10 transition shrink-0 bg-white/5 border border-white/10 mb-0.5">
                        {showPlusMenu ? <X size={24} strokeWidth={2.5}/> : <Plus size={24} strokeWidth={2.5} />}
                    </button>

                    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] flex items-center min-h-[50px] px-3 shadow-inner relative z-30">
                        {isRecording ? (
                            <div className="flex-1 flex items-center justify-between px-2 font-bold text-red-500 animate-pulse">
                                <div className="flex items-center gap-2"><Mic size={20} className="fill-red-500" /> <span>Recording {formatRecordingTime(recordingTime)}</span></div>
                                <button type="button" onClick={cancelRecording} className="text-white/50 hover:text-white transition p-1"><Trash2 size={20} /></button>
                            </div>
                        ) : (
                            <>
                                <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowPlusMenu(false); }} className="p-1.5 text-white/50 hover:text-white transition shrink-0">
                                    <Smile size={24} strokeWidth={2} />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Vibe check..."
                                    className="flex-1 bg-transparent px-2 outline-none text-[16px] text-white placeholder-white/40 font-semibold h-full py-3"
                                    value={newMessage}
                                    onChange={handleTyping}
                                    onFocus={() => { setShowEmojiPicker(false); setShowPlusMenu(false); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                                />
                                <Sparkles size={18} className="text-[#00E5FF] opacity-50 absolute right-4 drop-shadow-[0_0_8px_#00E5FF]" />
                                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                                <input type="file" accept=".pdf,.doc,.docx" ref={fileDocRef} className="hidden" onChange={handleDocUpload} />
                            </>
                        )}
                    </div>

                    <div className="mb-0.5">
                        {isRecording ? (
                            <button type="button" onClick={stopRecording} className="w-[50px] h-[50px] rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center hover:scale-105 transition shrink-0"><Send size={22} className="ml-1 text-white" strokeWidth={2.5}/></button>
                        ) : newMessage.trim() !== '' ? (
                            <button onClick={() => handleSendMessage()} className="w-[50px] h-[50px] rounded-full bg-gradient-to-tr from-[#7F5AF0] to-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center hover:scale-105 transition shrink-0"><Send size={22} strokeWidth={2.5} className="ml-1 text-white" /></button>
                        ) : (
                            <button type="button" onClick={startRecording} className="w-[50px] h-[50px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition shrink-0"><Mic size={22} strokeWidth={2.5} className="text-white" /></button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
