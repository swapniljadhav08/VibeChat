const Message = require('./models/Message');
const Chat = require('./models/Chat');

const onlineUsers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('register_user', (userId) => {
            onlineUsers.set(userId, socket.id);
            socket.join(userId.toString()); // Join a personal room for targeted notifications
            io.emit('online_users', Array.from(onlineUsers.keys()));
        });

        socket.on('join_room', (chatId) => {
            socket.join(chatId);
            console.log(`User ${socket.id} joined room ${chatId}`);
        });

        socket.on('update_location', async (data) => {
            try {
                const { userId, lat, lng } = data;
                const User = require('./models/User'); // lazy load or put at top
                
                await User.findByIdAndUpdate(userId, {
                    'location.lat': lat,
                    'location.lng': lng,
                    'location.lastUpdated': new Date()
                });

                // Broadcast to all connected clients that a user's location updated
                // The clients will check if this user is a friend and has privacy granting them access
                io.emit('friends_location_update', {
                    userId,
                    lat,
                    lng,
                    lastUpdated: new Date()
                });
            } catch (err) {
                console.error('Error updating location via socket', err);
            }
        });

        socket.on('send_message', async (data) => {
            try {
                const { chatId, senderId, messageType, content, expiresIn } = data;

                const newMessage = new Message({
                    chatId,
                    senderId,
                    messageType,
                    content,
                    expiresIn
                });
                await newMessage.save();

                await Chat.findByIdAndUpdate(chatId, {
                    lastMessage: {
                        text: messageType === 'text' ? content : (messageType === 'image' ? 'Sent a photo' : 'Sent a video'),
                        senderId,
                        timestamp: new Date()
                    }
                });

                // Populate senderId for client display
                await newMessage.populate('senderId', 'displayName photoURL');

                io.to(chatId).emit('receive_message', newMessage);

                // Notification Logic
                const chat = await Chat.findById(chatId);
                const { sendNotification } = require('./utils/notificationService');
                const titleMap = {
                    'text': 'New Message',
                    'image': 'New Snap',
                    'video': 'New Video'
                };
                for (const participantId of chat.participants) {
                    if (participantId.toString() !== senderId.toString()) {
                        let notificationBody = `${newMessage.senderId.displayName || 'Someone'} sent you a message.`;
                        if (content.startsWith('📞') || content.startsWith('❌')) {
                            notificationBody = content; // Show the actual system message content for calls
                        }
                        
                        // Don't send notification for '📞 Started a...' because the ringing overlay is the notification
                        if (!content.startsWith('📞')) {
                            await sendNotification(
                                io,
                                participantId,
                                'new_message',
                                titleMap[messageType] || 'New Message',
                                notificationBody,
                                { chatId, senderId }
                            );
                        }
                    }
                }

            } catch (error) {
                console.error("Error sending message via socket:", error);
            }
        });

        socket.on('start_typing', ({ chatId, senderId }) => {
            socket.to(chatId).emit('user_typing', { senderId });
        });

        socket.on('stop_typing', ({ chatId, senderId }) => {
            socket.to(chatId).emit('user_stopped_typing', { senderId });
        });

        socket.on('message_opened', async ({ messageId, chatId }) => {
            try {
                await Message.findByIdAndUpdate(messageId, { status: 'read' });
                io.to(chatId).emit('message_status_update', { messageId, status: 'read' });

                // Disappearing message logic
                const message = await Message.findById(messageId);
                // ONLY disappear if it has an expiry (Snaps)
                if (message && message.expiresIn && message.expiresIn > 0) {
                    const delay = message.expiresIn * 1000;
                    setTimeout(async () => {
                        // Instead of deleting, we clear the content, so it shows up as "Opened" in the UI forever
                        await Message.findByIdAndUpdate(messageId, { content: '' });
                        // Update clients that the content is wiped
                        io.to(chatId).emit('message_status_update', { messageId, status: 'read', content: '' });
                    }, delay);
                }
            } catch (error) {
                console.error("Error updating message status:", error);
            }
        });

        // Call Signaling (ZegoCloud)
        socket.on('initiate_call', async ({ chatId, callerId, roomId, callType, callerName }) => {
            try {
                const chat = await Chat.findById(chatId);
                if (chat) {
                    for (const participantId of chat.participants) {
                        if (participantId.toString() !== callerId.toString()) {
                            io.to(participantId.toString()).emit('incoming_call', {
                                chatId,
                                roomId,
                                callerId,
                                callerName,
                                callType
                            });
                            
                            // Send push notification for background app
                            const { sendNotification } = require('./utils/notificationService');
                            sendNotification(
                                null, // pass null so it doesn't emit duplicate 'new_notification' socket event
                                participantId,
                                'incoming_call',
                                'Incoming Call',
                                `${callerName} is calling you via ${callType}...`,
                                {
                                    chatId: chatId.toString(),
                                    roomId,
                                    callerId: callerId.toString(),
                                    callerName,
                                    callType
                                }
                            ).catch(err => console.error("Error triggering call push notification:", err));
                        }
                    }
                }
            } catch (err) {
                console.error("Error initiating call:", err);
            }
        });

        socket.on('reject_call', async ({ chatId, senderId }) => {
            try {
                const chat = await Chat.findById(chatId);
                if (chat && senderId) {
                    for (const participantId of chat.participants) {
                        if (participantId.toString() !== senderId.toString()) {
                            io.to(participantId.toString()).emit('call_rejected');
                        }
                    }
                } else {
                    socket.to(chatId).emit('call_rejected'); // fallback
                }
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('accept_call', async ({ chatId, senderId }) => {
            try {
                const chat = await Chat.findById(chatId);
                if (chat && senderId) {
                    for (const participantId of chat.participants) {
                        if (participantId.toString() !== senderId.toString()) {
                            io.to(participantId.toString()).emit('call_accepted');
                        }
                    }
                } else {
                    socket.to(chatId).emit('call_accepted'); // fallback
                }
            } catch (err) {
                console.error(err);
            }
        });
        
        socket.on('cancel_call', async ({ chatId, senderId }) => {
            try {
                const chat = await Chat.findById(chatId);
                if (chat && senderId) {
                    for (const participantId of chat.participants) {
                        if (participantId.toString() !== senderId.toString()) {
                            io.to(participantId.toString()).emit('call_cancelled');
                        }
                    }
                } else {
                    socket.to(chatId).emit('call_cancelled'); // fallback
                }
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            let disconnectedUserId = null;
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }
            if (disconnectedUserId) {
                io.emit('online_users', Array.from(onlineUsers.keys()));
            }
        });
    });
};
