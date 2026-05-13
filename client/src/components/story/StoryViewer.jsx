import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const StoryViewer = ({ storyGroup, onClose, authToken }) => {
    const { userData } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const progressInterval = useRef(null);
    const STORY_DURATION = 5000; // 5 seconds per story

    const stories = storyGroup?.stories || [];
    const currentStory = stories[currentIndex];
    const isMe = currentStory?.userId?._id === userData?._id;

    const currentIndexRef = useRef(currentIndex);
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    useEffect(() => {
        if (!currentStory) return;
        
        // Mark as viewed safely
        const viewers = currentStory.viewers || [];
        if (userData?._id && !viewers.includes(userData._id)) {
            axios.post(`${API_BASE_URL}/api/stories/${currentStory._id}/view`, {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            }).catch(err => console.error("Error marking story as viewed:", err));
        }

        setProgress(0);
        setIsPaused(false);
    }, [currentIndex, currentStory, authToken, userData?._id]);

    useEffect(() => {
        if (isPaused || !currentStory || currentStory.mediaType === 'video') return;

        const intervalTime = 50; 
        const increment = (intervalTime / STORY_DURATION) * 100;

        progressInterval.current = setInterval(() => {
            setProgress((prev) => {
                if (prev + increment >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + increment;
            });
        }, intervalTime);

        return () => clearInterval(progressInterval.current);
    }, [currentIndex, isPaused, currentStory]);

    const handleNext = () => {
        setCurrentIndex(prev => {
            if (prev < stories.length - 1) {
                return prev + 1;
            } else {
                onClose();
                return prev;
            }
        });
    };

    const handlePrev = () => {
        if (currentIndexRef.current > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            setProgress(0);
        }
    };

    const handleDelete = async () => {
        try {
            setIsPaused(true);
            await axios.delete(`${API_BASE_URL}/api/stories/${currentStory._id}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            toast.success("Story deleted");
            onClose(); // Just close it for now, could be improved to go to next
        } catch (err) {
            console.error("Error deleting story:", err);
            toast.error("Failed to delete story");
            setIsPaused(false);
        }
    };

    if (!currentStory) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Progress Bars */}
            <div className="absolute top-0 w-full px-2 pt-4 pb-2 z-20 flex gap-1 bg-gradient-to-b from-black/60 to-transparent">
                {stories.map((s, idx) => (
                    <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-75 ease-linear"
                            style={{ 
                                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 w-full px-4 z-20 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <img 
                        src={storyGroup.user?.photoURL || '/default-avatar.png'} 
                        alt="User" 
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                    />
                    <div>
                        <h3 className="font-semibold">{storyGroup.user?.displayName || 'User'}</h3>
                        <p className="text-xs text-white/70">
                            {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isMe && (
                        <button onClick={handleDelete} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <Trash2 size={20} className="text-white" />
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
                {/* Touch Areas for navigation */}
                <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev} />
                <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext} />
                
                {/* Pause on press middle */}
                <div 
                    className="absolute inset-y-0 left-1/3 right-1/3 z-10" 
                    onPointerDown={() => setIsPaused(true)}
                    onPointerUp={() => setIsPaused(false)}
                    onPointerLeave={() => setIsPaused(false)}
                />

                {currentStory.mediaType === 'video' ? (
                    <video 
                        src={currentStory.mediaUrl} 
                        className="w-full h-full object-contain"
                        autoPlay
                        playsInline
                        onEnded={handleNext}
                        onPause={() => setIsPaused(true)}
                        onPlay={() => setIsPaused(false)}
                        onTimeUpdate={(e) => {
                            const { currentTime, duration } = e.target;
                            if (duration > 0) {
                                setProgress((currentTime / duration) * 100);
                            }
                        }}
                    />
                ) : (
                    <img 
                        src={currentStory.mediaUrl} 
                        alt="Story" 
                        className="w-full h-full object-contain"
                    />
                )}
                
                {currentStory.caption && (
                    <div className="absolute bottom-12 w-full text-center px-4 z-20">
                        <div className="inline-block bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl text-white">
                            {currentStory.caption}
                        </div>
                    </div>
                )}
            </div>

            {/* Viewers count for my story */}
            {isMe && currentStory.viewers && (
                <div className="absolute bottom-4 left-0 w-full flex justify-center z-20 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white/90">
                        👁 {currentStory.viewers.length} views
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryViewer;
