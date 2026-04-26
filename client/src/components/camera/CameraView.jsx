import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import CameraPermissionPopup from './CameraPermissionPopup';

const CameraView = forwardRef((props, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const streamRef = useRef(null);

    const [hasPermission, setHasPermission] = useState(() => {
        return localStorage.getItem('cameraGranted') === 'true' ? true : null;
    }); // null = unknown, false = denied, true = granted
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    useImperativeHandle(ref, () => ({
        capturePhoto: async () => {
            if (videoRef.current && canvasRef.current && hasPermission) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (isFrontCamera) {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/jpeg', 0.8);
            }
            return null;
        },
        toggleCamera: () => {
            setIsFrontCamera(prev => !prev);
        },
        openGallery: () => {
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        }
    }));

    const startCamera = async () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: isFrontCamera ? 'user' : 'environment' },
                audio: false
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', true);
            }
            setHasPermission(true);
            localStorage.setItem('cameraGranted', 'true');
        } catch (err) {
            console.error("Camera Error:", err);
            setHasPermission(false);
            localStorage.removeItem('cameraGranted');
        }
    };

    const requestPermission = () => {
        startCamera();
    };

    useEffect(() => {
        if (hasPermission) {
            startCamera();
        }
        return () => {
             if (streamRef.current) {
                 streamRef.current.getTracks().forEach(track => track.stop());
             }
        }
    }, [isFrontCamera, hasPermission]);

    const handleFileChange = (e) => {
         const file = e.target.files[0];
         if (file && props.onPhotoSelect) {
             const reader = new FileReader();
             reader.onload = (event) => {
                 props.onPhotoSelect(event.target.result);
             };
             reader.readAsDataURL(file);
         }
    };

    return (
        <div className="absolute inset-0 w-full h-full bg-[#0F0F0F] overflow-hidden pointer-events-auto">
            {hasPermission === null && (
                <CameraPermissionPopup onAllow={requestPermission} isDenied={false} />
            )}

            {hasPermission === false && (
                <CameraPermissionPopup onAllow={requestPermission} isDenied={true} />
            )}

            <canvas ref={canvasRef} className="hidden" />
            
            {/* Hidden File Input for Gallery */}
            <input 
               type="file" 
               accept="image/*" 
               ref={fileInputRef} 
               className="hidden" 
               onChange={handleFileChange}
            />

            {hasPermission && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform select-none ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
                />
            )}
        </div>
    );
});

export default CameraView;
