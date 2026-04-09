const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getUsers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends', 'displayName email photoURL username');
        res.json({ users: user.friends || [] });
    } catch (error) {
        res.status(500).json({ error: 'Server Error fetching users' });
    }
};

exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ participants: { $in: [req.user._id] } })
            .populate('participants', 'displayName photoURL email firebaseUid username')
            .populate('lastMessage.senderId', 'displayName username')
            .sort({ updatedAt: -1 });
        res.json({ chats });
    } catch (error) {
        res.status(500).json({ error: 'Server Error fetching chats' });
    }
};

exports.createChat = async (req, res) => {
    try {
        const { participantId } = req.body;
        if (!participantId) return res.status(400).json({ error: 'Participant ID is required' });

        let chat = await Chat.findOne({
            participants: { $all: [req.user._id, participantId] }
        });

        if (!chat) {
            chat = new Chat({
                participants: [req.user._id, participantId]
            });
            await chat.save();
        }
        // re-populate to send back
        chat = await Chat.findById(chat._id).populate('participants', 'displayName photoURL email firebaseUid username');

        res.json({ chat });
    } catch (error) {
        res.status(500).json({ error: 'Server Error creating chat' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const messages = await Message.find({ chatId })
            .populate('senderId', 'displayName photoURL')
            .sort({ createdAt: 1 });

        // Disappearing messages logic: 
        // If they have been loaded, we could mark them as read or schedule deletion. 
        // For phase 4, let's keep it simple: we just fetch them for now.

        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: 'Server Error fetching messages' });
    }
};

exports.deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await Message.deleteMany({ chatId });
        await Chat.findByIdAndDelete(chatId);
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server Error deleting chat' });
    }
};

exports.sendSnapToFriends = async (req, res) => {
    try {
        const { participantIds, imageUrl, expiresIn } = req.body;

        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ error: 'Participant IDs array is required' });
        }
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        const sentChats = [];

        for (const participantId of participantIds) {
            // Find or create chat with this specific friend
            let chat = await Chat.findOne({
                participants: { $all: [req.user._id, participantId] }
            });

            if (!chat) {
                chat = new Chat({
                    participants: [req.user._id, participantId]
                });
                await chat.save();
            }

            // Create new snap Message
            const newMessage = new Message({
                chatId: chat._id,
                senderId: req.user._id,
                messageType: 'image',
                content: imageUrl,
                expiresIn: expiresIn || 10
            });
            await newMessage.save();

            // Update Chat Last Message
            chat.lastMessage = {
                text: 'Sent a Snap',
                senderId: req.user._id,
                timestamp: new Date()
            };
            await chat.save();

            // Populate senderId for client display
            await newMessage.populate('senderId', 'displayName photoURL');

            // Broadcast the new message to the specific chat room
            if (req.io) {
                req.io.to(chat._id.toString()).emit('receive_message', newMessage);
            }

            sentChats.push(chat._id);
        }

        res.json({ message: 'Snap sent successfully', sentCount: sentChats.length });

    } catch (error) {
        console.error("Error sending snap to multiple friends:", error);
        res.status(500).json({ error: 'Server Error sending snap' });
    }
};
