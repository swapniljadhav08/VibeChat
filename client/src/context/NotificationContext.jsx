import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video } from 'lucide-react';
import { messaging } from '../services/firebase';
import { getToken, onMessage } from 'firebase/messaging';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { currentUser, userData, authToken } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);
    const navigate = useNavigate();

    // Global Call States
    const [incomingCall, setIncomingCall] = useState(() => {
        const saved = sessionStorage.getItem('incomingCall');
        return saved ? JSON.parse(saved) : null;
    });
    const [outgoingCall, setOutgoingCall] = useState(() => {
        const saved = sessionStorage.getItem('outgoingCall');
        return saved ? JSON.parse(saved) : null;
    });
    const outgoingCallRef = useRef(outgoingCall);

    useEffect(() => {
        if (incomingCall) sessionStorage.setItem('incomingCall', JSON.stringify(incomingCall));
        else sessionStorage.removeItem('incomingCall');
    }, [incomingCall]);

    useEffect(() => {
        if (outgoingCall) {
            sessionStorage.setItem('outgoingCall', JSON.stringify(outgoingCall));
            outgoingCallRef.current = outgoingCall;
        } else {
            sessionStorage.removeItem('outgoingCall');
            outgoingCallRef.current = null;
        }
    }, [outgoingCall]);

    const fetchNotifications = async () => {
        if (!authToken) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const unread = (res.data.notifications || []).filter(n => !n.isRead);
            setNotifications(unread);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        if (userData && authToken) {
            fetchNotifications();

            // Setup Firebase Cloud Messaging
            const setupFCM = async () => {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        // Note: To use FCM in production web, you need a VAPID key
                        // Pass { vapidKey: 'YOUR_VAPID_KEY' } to getToken
                        const currentToken = await getToken(messaging, {
                            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined
                        });
                        if (currentToken) {
                            // Send token to our backend
                            await axios.put(`${API_BASE_URL}/api/auth/fcm-token`, 
                                { fcmToken: currentToken },
                                { headers: { Authorization: `Bearer ${authToken}` } }
                            );
                        }
                    }
                } catch (error) {
                    console.log('Error setting up FCM:', error);
                }
            };
            
            setupFCM();

            // Listen for foreground FCM messages
            onMessage(messaging, (payload) => {
                console.log('FCM Foreground message:', payload);
                if (payload.data?.type === 'incoming_call') {
                    // Update incoming call state if the web app is open but maybe they refreshed or socket reconnected late
                    setIncomingCall({
                        roomId: payload.data.roomId,
                        callerName: payload.data.callerName,
                        callType: payload.data.callType,
                        chatId: payload.data.chatId
                    });
                } else if (payload.notification) {
                    toast.success(`${payload.notification.title}: ${payload.notification.body}`);
                }
            });

            // Initialize global socket for notifications
            socketRef.current = io(API_BASE_URL);
            socketRef.current.emit('register_user', userData._id);

            socketRef.current.on('new_notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                toast.success(`New Notification: ${notification.title}`);
            });

            // Global Call Listeners
            socketRef.current.on('incoming_call', ({ roomId, callerName, callType, chatId }) => {
                setIncomingCall({ roomId, callerName, callType, chatId });
            });

            socketRef.current.on('call_rejected', () => {
                setIncomingCall(null);
                setOutgoingCall(null);
                outgoingCallRef.current = null;
            });

            socketRef.current.on('call_cancelled', () => {
                setIncomingCall(null);
            });

            socketRef.current.on('call_accepted', () => {
                if (outgoingCallRef.current) {
                    navigate(`/call/${outgoingCallRef.current.roomId}?type=${outgoingCallRef.current.callType}`);
                    setOutgoingCall(null);
                    outgoingCallRef.current = null;
                }
            });

            return () => {
                if (socketRef.current) socketRef.current.disconnect();
            };
        }
    }, [userData, authToken]);

    const markAsRead = async (notificationId) => {
        try {
            await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (notificationId === 'all') {
                setNotifications([]);
                setUnreadCount(0);
            } else {
                setNotifications(notifications.filter(n => n._id !== notificationId));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const startCall = (chatId, participantName, participantPhoto, type) => {
        if (!userData || !socketRef.current) return;
        const customRoomId = `room_${Date.now()}_${chatId}`;

        // Send a system message that a call started
        socketRef.current.emit('send_message', {
            chatId,
            senderId: userData._id,
            messageType: 'text',
            content: `📞 Started a ${type} call...`,
            expiresIn: 0
        });

        const callData = {
            chatId,
            callerId: userData._id,
            callerName: userData.displayName || userData.username,
            roomId: customRoomId,
            callType: type,
            participantName,
            participantPhoto
        };

        socketRef.current.emit('initiate_call', callData);
        setOutgoingCall(callData);
        outgoingCallRef.current = callData;
    };

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        fetchNotifications,
        startCall,
        globalSocket: socketRef.current
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            
            {/* Global Incoming Call Overlay */}
            <AnimatePresence>
                {incomingCall && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center pt-20 pb-safe shadow-inner"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }} 
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#00E5FF]/20 rounded-full blur-[80px]"
                        ></motion.div>

                        <div className="flex-1 flex flex-col items-center justify-center z-10">
                            {incomingCall.callType === 'video' ? <Video size={40} className="text-white/50 mb-3" /> : <Phone size={40} className="text-white/50 mb-3" />}
                            <h2 className="text-[34px] font-extrabold text-white tracking-tight drop-shadow-lg mb-2 text-center">{incomingCall.callerName}</h2>
                            <p className="text-[#00E5FF] font-medium tracking-[0.2em] uppercase text-sm animate-pulse">Incoming {incomingCall.callType} call...</p>
                            
                            <div className="mt-16 w-[140px] h-[140px] rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_40px_rgba(0,229,255,0.4)]">
                                <div className="w-full h-full bg-[#1A1A24] flex items-center justify-center text-5xl">😎</div>
                            </div>
                        </div>

                        <div className="flex gap-10 z-10 mb-20">
                            <motion.button 
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    socketRef.current.emit('reject_call', { chatId: incomingCall.chatId, senderId: userData._id });
                                    
                                    socketRef.current.emit('send_message', {
                                        chatId: incomingCall.chatId,
                                        senderId: userData._id,
                                        messageType: 'text',
                                        content: `❌ Missed ${incomingCall.callType} call`,
                                        expiresIn: 0
                                    });

                                    setIncomingCall(null);
                                }}
                                className="w-[70px] h-[70px] rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                            >
                                <Phone size={30} className="text-white transform rotate-[135deg]" fill="currentColor"/>
                            </motion.button>
                            
                            <motion.button 
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    socketRef.current.emit('accept_call', { chatId: incomingCall.chatId, senderId: userData._id });
                                    navigate(`/call/${incomingCall.roomId}?type=${incomingCall.callType}`);
                                    setIncomingCall(null);
                                }}
                                className="w-[70px] h-[70px] rounded-full bg-[#00C853] flex items-center justify-center shadow-[0_0_20px_rgba(0,200,83,0.5)] animate-bounce"
                            >
                                {incomingCall.callType === 'video' ? <Video size={30} className="text-white" fill="currentColor"/> : <Phone size={30} className="text-white" fill="currentColor"/>}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Outgoing Call Overlay */}
            <AnimatePresence>
                {outgoingCall && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center pt-20 pb-safe shadow-inner"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }} 
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#7F5AF0]/20 rounded-full blur-[80px]"
                        ></motion.div>

                        <div className="flex-1 flex flex-col items-center justify-center z-10 mt-10">
                            <h2 className="text-[34px] font-extrabold text-white tracking-tight drop-shadow-lg mb-2 text-center">{outgoingCall.participantName || 'Calling...'}</h2>
                            <p className="text-[#00E5FF] font-medium tracking-[0.2em] uppercase text-sm animate-pulse">Ringing...</p>
                            
                            <div className="mt-16 w-[140px] h-[140px] rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_40px_rgba(127,90,240,0.4)]">
                                {outgoingCall.participantPhoto ? <img src={outgoingCall.participantPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1A1A24] flex items-center justify-center text-5xl">😎</div>}
                            </div>
                        </div>

                        <div className="flex gap-10 z-10 mb-20">
                            <motion.button 
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    socketRef.current.emit('cancel_call', { chatId: outgoingCall.chatId, senderId: userData._id });
                                    
                                    socketRef.current.emit('send_message', {
                                        chatId: outgoingCall.chatId,
                                        senderId: userData._id,
                                        messageType: 'text',
                                        content: `❌ Cancelled call`,
                                        expiresIn: 0
                                    });

                                    setOutgoingCall(null);
                                    outgoingCallRef.current = null;
                                }}
                                className="w-[70px] h-[70px] rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                            >
                                <Phone size={30} className="text-white transform rotate-[135deg]" fill="currentColor"/>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    );
};
