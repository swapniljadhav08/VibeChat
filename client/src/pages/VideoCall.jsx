import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft } from 'lucide-react';

const VideoCall = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { userData } = useAuth();
    const containerRef = useRef(null);
    const location = useLocation();

    // Extract query params for call type
    const queryParams = new URLSearchParams(location.search);
    const callType = queryParams.get('type') || 'video'; // 'video' or 'audio'

    const myMeeting = async (element) => {
        if (!userData || !element) return;
        
        // Prevent double mounting in React Strict Mode
        if (element.hasAttribute('data-zego-joined')) return;
        element.setAttribute('data-zego-joined', 'true');

        try {
            const appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID || "0", 10);
            const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || "";

            if (!appID || !serverSecret) {
                console.error("ZegoCloud credentials missing in .env");
                return;
            }

            // Generate a Kit Token using stable User ID
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID, 
                serverSecret, 
                roomId, 
                userData._id.toString(), // Use the actual stable database ID!
                userData.displayName || userData.username || "Vibe User"
            );

            // Create the ZegoUIKit instance
            const zp = ZegoUIKitPrebuilt.create(kitToken);
            
            const isVideo = callType === 'video';

            zp.joinRoom({
                container: element,
                scenario: {
                    mode: ZegoUIKitPrebuilt.OneONoneCall,
                },
                turnOnCameraWhenJoining: isVideo,
                showMyCameraToggleButton: isVideo,
                showAudioVideoSettingsButton: true,
                showScreenSharingButton: false,
                showTextChat: false,
                showUserList: false,
                branding: {
                    logoURL: '' 
                },
                onLeaveRoom: () => {
                    navigate(-1); 
                }
            });

        } catch (error) {
            console.error("Error joining ZegoCloud room:", error);
        }
    };

    return (
        <div className="h-screen w-screen bg-[#0F0F14] flex flex-col relative overflow-hidden">
            {/* Custom Header */}
            <div className="absolute top-0 inset-x-0 p-4 pt-[max(env(safe-area-inset-top),20px)] flex justify-between items-center z-[100] pointer-events-none">
                <button onClick={() => navigate(-1)} className="pointer-events-auto w-11 h-11 flex items-center justify-center bg-[#0F0F14]/50 backdrop-blur-md rounded-full text-white shadow-lg hover:bg-white/10 transition border border-white/10">
                    <ChevronLeft size={28} strokeWidth={2.5} className="-ml-1" />
                </button>
            </div>
            
            {/* ZegoCloud Container */}
            <div 
                className="w-full h-full flex-1 [&_.zc-video-view]:bg-[#0F0F14] [&_.zc-control-bar]:bg-[#1A1A24]/90 [&_.zc-control-bar]:backdrop-blur-xl [&_.zc-control-bar]:border-t [&_.zc-control-bar]:border-white/10" 
                ref={myMeeting}
            ></div>
        </div>
    );
};

export default VideoCall;
