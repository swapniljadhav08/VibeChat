import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import CameraView from '../components/camera/CameraView';
import PhotoPreview from '../components/camera/PhotoPreview';
import SendToModal from '../components/camera/SendToModal';
import BirthdayEffects from '../components/effects/BirthdayEffects';
import FilterCarousel from '../components/camera/FilterCarousel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Home = () => {
    const { logout, authToken, userData } = useAuth();
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showBirthdayAnim, setShowBirthdayAnim] = useState(false);
    const [showSendToModal, setShowSendToModal] = useState(false);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilter, setActiveFilter] = useState('none');

    const cameraRef = useRef(null);

    useEffect(() => {
        if (userData && userData.dateOfBirth) {
            const dob = new Date(userData.dateOfBirth);
            const today = new Date();
            if (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) {
                setShowBirthdayAnim(true);
            }
        }
    }, [userData]);

    const handleCapturePhoto = async () => {
        // Automatically hide the picker so it doesn't get exported in the picture
        setShowFilters(false);
        if (cameraRef.current) {
            const photoDataUrl = await cameraRef.current.capturePhoto();
            if (photoDataUrl) {
                setCapturedPhoto(photoDataUrl);
            }
        }
    };

    const handleDiscardPhoto = () => {
        setCapturedPhoto(null);
        setShowSendToModal(false);
    };

    const handleOpenSendTo = (editedPhotoUrl) => {
        if (editedPhotoUrl && typeof editedPhotoUrl === 'string') {
            setCapturedPhoto(editedPhotoUrl);
        }
        setShowSendToModal(true);
    };

    const handleSendPhotoToFriends = async (selectedFriendIds) => {
        if (!capturedPhoto || !authToken || selectedFriendIds.length === 0) return;

        setIsUploading(true);
        try {
            // 1. Upload the snap to Cloudinary
            const uploadRes = await axios.post(`${API_BASE_URL}/api/upload/snap`,
                { imageBase64: capturedPhoto },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            const imageUrl = uploadRes.data.url;

            // 2. Send the snap to all selected friends!
            await axios.post(`${API_BASE_URL}/api/chat/send-snap`, {
                participantIds: selectedFriendIds,
                imageUrl: imageUrl,
                expiresIn: 10 // Snapchat style ephemeral
            }, { headers: { Authorization: `Bearer ${authToken}` } });

            toast.success(`Snap sent to ${selectedFriendIds.length} friend${selectedFriendIds.length > 1 ? 's' : ''}!`);
            setCapturedPhoto(null);
            setShowSendToModal(false);
        } catch (error) {
            console.error("Upload/Send failed:", error);
            toast.error("Failed to send Snap. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggleFilterPicker = () => {
        setShowFilters(!showFilters);
    };

    const handleSelectFilter = (filterId) => {
        setActiveFilter(filterId);
        if (cameraRef.current) {
            cameraRef.current.toggleFilter(filterId);
        }
    };

    return (
        <div className="flex flex-col h-full w-full items-center justify-center bg-surface-950 text-surface-50 relative overflow-hidden">

            {/* Glowing orbs for depth */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-900/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-800/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {showBirthdayAnim && (
                <BirthdayEffects
                    name={userData?.displayName}
                    onComplete={() => setShowBirthdayAnim(false)}
                />
            )}

            {capturedPhoto ? (
                <div className="z-10 w-full h-full flex flex-col items-center justify-center">
                    <PhotoPreview
                        photoUrl={capturedPhoto}
                        onDiscard={handleDiscardPhoto}
                        onSend={handleOpenSendTo}
                        isUploading={isUploading}
                    />
                    {showSendToModal && (
                        <SendToModal
                            onClose={() => setShowSendToModal(false)}
                            onSend={handleSendPhotoToFriends}
                            isUploading={isUploading}
                        />
                    )}
                </div>
            ) : (
                <>
                    <div className="z-10 w-full h-full">
                        <CameraView ref={cameraRef} />
                    </div>
                    <Header userData={userData} logout={logout} />

                    <BottomNav
                        onCapture={handleCapturePhoto}
                        onToggleFilter={handleToggleFilterPicker}
                        showFilters={showFilters}
                        currentFilter={activeFilter}
                        onSelectFilter={handleSelectFilter}
                    />
                </>
            )}

        </div>
    );
};

export default Home;
