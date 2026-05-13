const Story = require('../models/Story');
const User = require('../models/User');

exports.createStory = async (req, res) => {
    try {
        const { mediaUrl, mediaType, caption, location, isMapStory } = req.body;
        const userId = req.user._id;

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const newStory = new Story({
            userId,
            mediaUrl,
            mediaType,
            caption,
            location,
            isMapStory,
            expiresAt
        });

        await newStory.save();
        res.status(201).json(newStory);
    } catch (error) {
        console.error('Error creating story:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getFeed = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate('friends');
        const friendIds = user.friends.map(f => f._id);
        
        const allRelevantUserIds = [...friendIds, userId];

        const stories = await Story.find({
            userId: { $in: allRelevantUserIds },
            expiresAt: { $gt: new Date() }
        }).populate('userId', 'displayName username photoURL')
          .sort({ createdAt: 1 }); // Sort ascending so oldest is first in the viewer

        // Group stories by user
        const groupedStories = {};
        
        stories.forEach(story => {
            const storyUserId = story.userId._id.toString();
            if (!groupedStories[storyUserId]) {
                groupedStories[storyUserId] = {
                    user: story.userId,
                    stories: [],
                    lastUpdated: story.createdAt,
                    allViewed: true
                };
            }
            
            groupedStories[storyUserId].stories.push(story);
            
            // If at least one story is not viewed by the current user, mark allViewed as false
            const hasViewed = story.viewers.includes(userId);
            if (!hasViewed) {
                groupedStories[storyUserId].allViewed = false;
            }
            
            // Update lastUpdated to the most recent story's creation time
            if (new Date(story.createdAt) > new Date(groupedStories[storyUserId].lastUpdated)) {
                groupedStories[storyUserId].lastUpdated = story.createdAt;
            }
        });

        // Convert to array and separate into 'my story' and 'friends stories'
        const groupedArray = Object.values(groupedStories);
        
        let myStory = null;
        let friendsStories = [];
        
        groupedArray.forEach(group => {
            if (group.user._id.toString() === userId.toString()) {
                myStory = group;
            } else {
                friendsStories.push(group);
            }
        });

        // Sort friends' stories: unviewed first, then by most recently updated
        friendsStories.sort((a, b) => {
            if (a.allViewed === b.allViewed) {
                return new Date(b.lastUpdated) - new Date(a.lastUpdated);
            }
            return a.allViewed ? 1 : -1;
        });

        res.json({
            myStory,
            friendsStories
        });
    } catch (error) {
        console.error('Error fetching stories feed:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.markViewed = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        await Story.findByIdAndUpdate(id, {
            $addToSet: { viewers: userId }
        });

        res.json({ message: 'Story marked as viewed' });
    } catch (error) {
        console.error('Error marking story as viewed:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const story = await Story.findOne({ _id: id, userId });
        if (!story) {
            return res.status(404).json({ message: 'Story not found or unauthorized' });
        }

        await Story.findByIdAndDelete(id);
        res.json({ message: 'Story deleted' });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ message: error.message });
    }
};
