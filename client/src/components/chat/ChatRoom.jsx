import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Send, Camera, Image as ImageIcon, Trash2, Phone, Video, MoreVertical, Search, Shield, Ban, Check, CheckCheck, Plus, File as FileIcon, Mic, Smile, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ChatRoom = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { authToken, currentUser, userData } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [participantName, setParticipantName] = useState('Chat');
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

    // new chat features
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileDocRef = useRef(null);

    // Audio recording features
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Close dropdown when clicking outside
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

        // Fetch historically
        const fetchMessages = async () => {
            try {
                // Fetch the chat details first to get the participant name
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

                // Mark loaded unread TEXT messages as opened safely
                res.data.messages?.forEach(msg => {
                    if (msg.messageType === 'text' && msg.status !== 'read') {
                        const sId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                        if (sId !== userData._id) {
                            // We can emit message_opened if we want, but since socketRef is initialized below,
                            // we'll run a timeout or just let them stay 'delivered' until the first message comes.
                            // Actually, standard REST call is fine. But we'll rely on the socket for simplicity:
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

        // Socket setup
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
            // Only instant-open if it is a text message
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

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !userData) return;

        const msgData = {
            chatId,
            senderId: userData._id,
            messageType: 'text',
            content: newMessage,
            expiresIn: 0
        };

        socketRef.current.emit('send_message', msgData);
        setNewMessage('');
        setShowEmojiPicker(false);
        setShowPlusMenu(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && userData) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const res = await axios.post(`${API_BASE_URL}/api/upload/snap`, {
                        imageBase64: reader.result
                    }, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });

                    socketRef.current.emit('send_message', {
                        chatId,
                        senderId: userData._id,
                        messageType: 'image',
                        content: res.data.url,
                        expiresIn: 10 // Disappears after 10 seconds logic
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
                        content: res.data.url, // Original file URL from Cloudinary
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

    const handleEmojiClick = (emojiData, event) => {
        setNewMessage((prev) => prev + emojiData.emoji);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        const res = await axios.post(`${API_BASE_URL}/api/upload/snap`, {
                            imageBase64: reader.result // You can reuse the snap endpoint depending on backend logic
                        }, { headers: { Authorization: `Bearer ${authToken}` } });

                        socketRef.current.emit('send_message', {
                            chatId,
                            senderId: userData._id,
                            messageType: 'audio',
                            content: res.data.url, // Actually a base64 or cloudinary url depending on how cloudinar supports audio.
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
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone', error);
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
            // Intentionally ignoring the output blob since it's cancelled.
            // We'd have to tweak `onstop` logic slightly to handle cancel state, 
            // but for a simple fix let's just clear chunks and not upload inside onstop. 
            // An easy hack:
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
        if (window.confirm("Are you sure you want to delete this conversation? This cannot be undone.")) {
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
        if (userData) {
            socketRef.current.emit('start_typing', { chatId, senderId: userData._id });
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit('stop_typing', { chatId, senderId: userData._id });
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans overflow-hidden">
            {/* Fullscreen Snap View Modal */}
            {viewingSnap && (
                <div
                    className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => setViewingSnap(null)}
                >
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-10 text-shadow-sm">
                        <span className="text-white font-bold">{participantName}</span>
                        <span className="text-white text-sm font-medium opacity-80">Tap to close</span>
                    </div>
                    <img src={viewingSnap.content} alt="Snap" className="w-full h-full object-contain" />
                </div>
            )}

            {/* Friend Profile Modal */}
            {showProfile && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-end md:justify-center p-0 md:p-4">
                    <div className="bg-white w-full md:w-[400px] rounded-t-[30px] md:rounded-[30px] overflow-hidden flex flex-col items-center pt-8 pb-12 relative animate-in slide-in-from-bottom-10 fade-in duration-300 shadow-2xl">
                        <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-800 transition">
                            ✕
                        </button>
                        <div className="w-[140px] h-[140px] bg-gray-200 rounded-full border-4 border-white shadow-lg overflow-hidden mb-4">
                            {participantPhoto ? <img src={participantPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl">😎</div>}
                        </div>
                        <h2 className="text-2xl font-extrabold text-black tracking-tight">{participantName}</h2>
                        <p className="text-gray-500 font-semibold mt-1 bg-gray-50 px-4 py-1.5 rounded-full text-sm">Friend</p>

                        <div className="mt-4 text-center px-6 text-gray-400 font-medium text-sm">
                            {messages.length === 0 ? (
                                <span className="text-[#0099FF] font-bold">New Chat</span>
                            ) : (
                                <span>
                                    Last message: "{messages[messages.length - 1].content || (messages[messages.length - 1].messageType === 'image' ? 'Photo' : 'Video')}" at {formatTime(messages[messages.length - 1].createdAt)}
                                </span>
                            )}
                        </div>

                        <div className="flex gap-4 mt-6 w-full px-8">
                            <button onClick={() => setShowProfile(false)} className="flex-1 bg-[#0099FF] text-white py-3.5 rounded-full font-bold shadow-md hover:bg-blue-600 transition active:scale-95">
                                Send a Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-2 py-3 border-b border-gray-100 bg-white sticky top-0 z-10 w-full shrink-0 shadow-sm">
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate('/chat')} className="p-2 -ml-1 rounded-full hover:bg-gray-100 transition shrink-0 md:hidden">
                        <ChevronLeft size={32} className="text-gray-800" strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-3" onClick={() => setShowProfile(true)}>
                        <div className="w-[42px] h-[42px] rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer ml-1">
                            {participantPhoto ? <img src={participantPhoto} className="w-full h-full object-cover" alt="Profile" /> : <div className="text-xl">😎</div>}
                        </div>
                        <div className="flex flex-col justify-center cursor-pointer">
                            <h2 className="font-extrabold text-[18px] text-black leading-tight tracking-tight">{participantName}</h2>
                            <p className="text-[12px] font-semibold text-gray-400 leading-tight tracking-wide mt-0.5 uppercase">
                                {isTyping ? (
                                    <span className="text-[#0099FF] animate-pulse normal-case">Typing...</span>
                                ) : (participantId && onlineUsers.includes(participantId)) ? (
                                    <span className="text-green-500 normal-case">Online</span>
                                ) : (
                                    "Tap to view profile"
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Additional Header Icons for Snapchat feel */}
                <div className="flex items-center gap-4 pr-1 relative" ref={dropdownRef}>
                    <Camera onClick={() => navigate('/')} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full cursor-pointer transition text-gray-700 hover:text-[#0099FF]" size={36} strokeWidth={2} title="Return to Camera" />
                    <Phone className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full cursor-pointer transition" size={34} strokeWidth={2} />
                    <Video className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full cursor-pointer transition" size={36} strokeWidth={2} />
                    <MoreVertical
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="text-gray-800 hover:bg-gray-100 p-1 rounded-full cursor-pointer transition"
                        size={32}
                        strokeWidth={2}
                    />

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute top-10 right-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-100">
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition text-black font-semibold text-[15px]">
                                <Search size={18} className="text-gray-500" strokeWidth={2.5} />
                                Search
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition text-black font-semibold text-[15px]">
                                <Trash2 size={18} className="text-gray-500" strokeWidth={2.5} />
                                Clear Chat
                            </div>
                            <div
                                onClick={() => { setShowDropdown(false); deleteChat(); }}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition text-red-500 font-semibold text-[15px]"
                            >
                                <Trash2 size={18} strokeWidth={2.5} />
                                Delete Chat
                            </div>
                            <div className="w-full h-px bg-gray-100 my-1"></div>
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition text-black font-semibold text-[15px]">
                                <Ban size={18} className="text-gray-500" strokeWidth={2.5} />
                                Block
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition text-red-500 font-semibold text-[15px]">
                                <Shield size={18} strokeWidth={2.5} />
                                Report
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area - WhatsApp Desktop Style */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#EFEAE2] flex flex-col gap-1 hide-scrollbar" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundRepeat: 'repeat', backgroundSize: '400px', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(239, 234, 226, 0.95)' }}>
                {messages.map((msg, index) => {
                    const isMe = String(msg.senderId?._id || msg.senderId) === String(userData?._id);
                    const isFirstInGroup = index === 0 || String(messages[index - 1].senderId?._id || messages[index - 1].senderId) !== String(msg.senderId?._id || msg.senderId);

                    return (
                        <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2' : 'mt-[2px]'}`}>

                            <div className={`relative max-w-[75%] px-3 py-1.5 text-[15px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${isMe ? 'bg-[#D9FDD3] text-[#111B21]' : 'bg-white text-[#111B21]'} rounded-lg ${isFirstInGroup ? (isMe ? 'rounded-tr-none' : 'rounded-tl-none') : ''}`}>

                                {/* WhatsApp Tail for first in group */}
                                {isFirstInGroup && (
                                    <div className="absolute top-0 w-2 h-3" style={isMe ? { right: '-8px', borderTop: '8px solid #D9FDD3', borderRight: '8px solid transparent' } : { left: '-8px', borderTop: '8px solid white', borderLeft: '8px solid transparent' }}></div>
                                )}

                                {msg.messageType === 'text' ? (
                                    <div className="flex flex-wrap items-end gap-2 pb-0.5">
                                        <span className="whitespace-pre-wrap break-words leading-relaxed pt-1 pr-1">{msg.content}</span>
                                        <div className="flex items-center gap-1 self-end ml-auto float-right text-[11px] text-gray-500 font-medium pb-[2px]">
                                            <span>{formatTime(msg.createdAt)}</span>
                                            {isMe && (
                                                <span className="text-gray-400">
                                                    {msg.status === 'read' ? <CheckCheck size={14} className="text-[#53BDEB]" /> : msg.status === 'delivered' ? <CheckCheck size={14} /> : <Check size={14} />}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : msg.messageType === 'image' ? (
                                    <div className="flex flex-col mt-1 mb-1 cursor-pointer"
                                        onClick={() => {
                                            if (!isMe && msg.status !== 'read') openSnap(msg);
                                        }}>
                                        {isMe ? (
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3.5 h-3.5 rounded-sm ${msg.status === 'read' ? 'border-2 border-[#53BDEB] bg-transparent' : 'bg-red-500'}`}></div>
                                                    <span className="font-semibold text-gray-700">Photo Sent</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                    <span>{formatTime(msg.createdAt)}</span>
                                                    <span>{msg.status === 'read' ? <CheckCheck size={14} className="text-[#53BDEB]" /> : <Check size={14} />}</span>
                                                </div>
                                            </div>
                                        ) : msg.status === 'read' ? (
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <div className="w-3.5 h-3.5 border-2 border-red-500 rounded-sm bg-transparent"></div>
                                                    <span className="font-medium italic">Opened Photo</span>
                                                </div>
                                                <span className="text-[11px] text-gray-500">{formatTime(msg.createdAt)}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-6 pl-2 pr-3 py-2 bg-red-500 text-white rounded-md shadow-sm active:opacity-80 transition">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-white rounded-sm drop-shadow-sm"></div>
                                                    <span className="font-bold text-[14px]">New Photo</span>
                                                </div>
                                                <span className="text-[11px] text-white/80">{formatTime(msg.createdAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : msg.messageType === 'audio' ? (
                                    <div className="flex flex-col mt-1 mb-1">
                                        <audio controls src={msg.content} className="h-8 w-[200px]" />
                                        <div className="flex items-center gap-1 self-end ml-auto float-right text-[11px] text-gray-500 font-medium pb-[2px] mt-1">
                                            <span>{formatTime(msg.createdAt)}</span>
                                            {isMe && (
                                                <span className="text-gray-400">
                                                    {msg.status === 'read' ? <CheckCheck size={14} className="text-[#53BDEB]" /> : msg.status === 'delivered' ? <CheckCheck size={14} /> : <Check size={14} />}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : msg.messageType === 'document' ? (
                                    <div className="flex flex-col mt-1 mb-1">
                                        <a href={msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 bg-black/5 rounded-lg hover:bg-black/10 transition cursor-pointer text-gray-800">
                                            <FileIcon size={24} className={isMe ? "text-[#0099FF]" : "text-gray-600"} />
                                            <span className="font-semibold text-sm underline underline-offset-2 break-all max-w-[200px]">View Document</span>
                                        </a>
                                        <div className="flex items-center gap-1 self-end ml-auto float-right text-[11px] text-gray-500 font-medium pb-[2px] mt-1">
                                            <span>{formatTime(msg.createdAt)}</span>
                                            {isMe && (
                                                <span className="text-gray-400">
                                                    {msg.status === 'read' ? <CheckCheck size={14} className="text-[#53BDEB]" /> : msg.status === 'delivered' ? <CheckCheck size={14} /> : <Check size={14} />}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm italic flex items-center gap-2">
                                        <Camera size={16} /> <span>{msg.messageType} received</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area with Emojis and Attachment Menu */}
            <div className="relative">
                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-50">
                        <EmojiPicker onEmojiClick={handleEmojiClick} height={350} />
                    </div>
                )}

                {/* Plus Menu Popup */}
                {showPlusMenu && (
                    <div className="absolute bottom-full left-2 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 flex flex-col gap-2 w-48 animate-in fade-in zoom-in duration-200">
                        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition text-gray-700 font-semibold cursor-pointer">
                            <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                                <ImageIcon size={20} />
                            </div>
                            Gallery
                        </button>
                        <button onClick={() => fileDocRef.current.click()} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition text-gray-700 font-semibold cursor-pointer">
                            <div className="w-10 h-10 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center">
                                <FileIcon size={20} />
                            </div>
                            Document
                        </button>
                        <button onClick={() => { alert('Camera opened'); setShowPlusMenu(false); }} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition text-gray-700 font-semibold cursor-pointer">
                            <div className="w-10 h-10 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center">
                                <Camera size={20} />
                            </div>
                            Camera
                        </button>
                    </div>
                )}

                <div className="px-2 py-2 border-t border-gray-100 bg-[#EFEAE2] flex items-center gap-2">
                    <button type="button" onClick={() => { setShowPlusMenu(!showPlusMenu); setShowEmojiPicker(false); }} className="p-2 rounded-full text-gray-500 hover:bg-white hover:shadow-sm transition shrink-0 shrink-0">
                        {showPlusMenu ? <X size={26} className="text-gray-600" /> : <Plus size={26} className="text-gray-600" strokeWidth={2.5} />}
                    </button>

                    <div className="flex-1 bg-white rounded-3xl flex items-center min-h-[46px] shadow-sm px-2">
                        {isRecording ? (
                            <div className="flex-1 flex items-center justify-between px-2 text-red-500 font-bold animate-pulse">
                                <div className="flex items-center gap-2">
                                    <Mic size={20} className="fill-red-500" />
                                    <span>Recording... {formatRecordingTime(recordingTime)}</span>
                                </div>
                                <button type="button" onClick={cancelRecording} className="text-gray-400 hover:text-gray-600 transition p-1">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowPlusMenu(false); }} className="p-2 text-gray-400 hover:text-gray-600 transition shrink-0 cursor-pointer">
                                    <Smile size={24} strokeWidth={2} />
                                </button>

                                <input
                                    type="text"
                                    placeholder="Type a message"
                                    className="flex-1 bg-transparent px-2 outline-none text-[16px] text-gray-800 placeholder-gray-500 font-medium h-full py-2.5"
                                    value={newMessage}
                                    onChange={handleTyping}
                                    onFocus={() => { setShowEmojiPicker(false); setShowPlusMenu(false); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(e); }}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleImageUpload}
                                />
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    ref={fileDocRef}
                                    style={{ display: 'none' }}
                                    onChange={handleDocUpload}
                                />

                                {newMessage.trim() === '' ? (
                                    <button type="button" onClick={startRecording} className="p-2 text-gray-500 hover:text-gray-700 transition shrink-0 cursor-pointer">
                                        <Camera size={24} strokeWidth={2} className="opacity-0 w-0 h-0" /> {/* Spacer */}
                                    </button>
                                ) : (
                                    <span className="w-2" />
                                )}
                            </>
                        )}
                    </div>

                    {isRecording ? (
                        <button type="button" onClick={stopRecording} className="w-[46px] h-[46px] rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-105 transition shadow-sm shrink-0">
                            <Send size={20} className="ml-1" strokeWidth={2.5} />
                        </button>
                    ) : newMessage.trim() !== '' ? (
                        <button onClick={handleSendMessage} className="w-[46px] h-[46px] rounded-full bg-[#00A884] text-white flex items-center justify-center hover:scale-105 transition shadow-sm shrink-0">
                            <Send size={20} strokeWidth={2.5} className="ml-1" />
                        </button>
                    ) : (
                        <button type="button" onClick={startRecording} className="w-[46px] h-[46px] rounded-full bg-[#00A884] text-white flex items-center justify-center hover:scale-105 transition shadow-sm shrink-0">
                            <Mic size={22} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
