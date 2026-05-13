import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import CameraPermissionPopup from './CameraPermissionPopup';
import * as deepar from 'deepar';

const CameraView = forwardRef((props, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const deepARCanvasRef = useRef(null);
    const streamRef = useRef(null);

    const [hasPermission, setHasPermission] = useState(() => {
        return localStorage.getItem('cameraGranted') === 'true' ? true : null;
    }); // null = unknown, false = denied, true = granted
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    
    // DeepAR States
    const [isDeepARActive, setIsDeepARActive] = useState(false);
    const [currentFilterName, setCurrentFilterName] = useState('none');
    const deepARObj = useRef(null);
    const isInitializingRef = useRef(false);
    
    const DEEPAR_KEY = import.meta.env.VITE_DEEPAR_KEY;

    useImperativeHandle(ref, () => ({
        currentFilter: { name: currentFilterName },
        capturePhoto: async () => {
            if (isDeepARActive && deepARObj.current) {
                try {
                    const dataUrl = await deepARObj.current.takeScreenshot();
                    return dataUrl;
                } catch (e) {
                    console.error("DeepAR Snipe Error", e);
                }
            }

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
        },
        toggleFilter: async (filterName) => {
            if (isDeepARActive && deepARObj.current) {
                try {
                    await deepARObj.current.clearEffect();
                    await deepARObj.current.backgroundBlur(false);

                    if (filterName === 'none') {
                        // Already cleared
                    } else if (filterName === 'background_blur') {
                        await deepARObj.current.backgroundBlur(true, 8);
                    } else {
                        await deepARObj.current.switchEffect(`/effects/${filterName}.deepar`);
                    }
                    setCurrentFilterName(filterName);
                } catch (err) {
                    console.error("Filter Engine Error: ", err);
                }
            }
        }
    }));

    const startCamera = async () => {
        if (isInitializingRef.current || deepARObj.current) return;

        if (DEEPAR_KEY && deepARCanvasRef.current) {
            isInitializingRef.current = true;
            try {
                const dpr = window.devicePixelRatio || 1;
                deepARCanvasRef.current.width = window.innerWidth * dpr;
                deepARCanvasRef.current.height = window.innerHeight * dpr;

                const deepARInstance = await deepar.initialize({
                    licenseKey: DEEPAR_KEY,
                    canvas: deepARCanvasRef.current,
                    additionalOptions: {
                        cameraConfig: { facingMode: isFrontCamera ? 'user' : 'environment' }
                    }
                });

                deepARObj.current = deepARInstance;
                setIsDeepARActive(true);
                setHasPermission(true);
                localStorage.setItem('cameraGranted', 'true');
                isInitializingRef.current = false;
                
                // Re-apply the current filter if one was selected
                if (currentFilterName !== 'none') {
                    if (currentFilterName === 'background_blur') {
                        await deepARInstance.backgroundBlur(true, 8);
                    } else {
                        await deepARInstance.switchEffect(`/effects/${currentFilterName}.deepar`);
                    }
                }
                
                return;
            } catch (err) {
                console.error("DeepAR Init Failed - Fallback", err);
                isInitializingRef.current = false;
            }
        }

        startNormalCamera();
    };

    const startNormalCamera = async () => {
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

    // Initialize or restart camera based on permission and facingMode
    useEffect(() => {
        if (hasPermission) {
            // Need to shutdown old instance to restart with new camera
            const restartDeepAR = async () => {
                if (deepARObj.current) {
                    await deepARObj.current.shutdown();
                    deepARObj.current = null;
                    setIsDeepARActive(false);
                }
                startCamera();
            };
            restartDeepAR();
        }
        
        return () => {
             if (streamRef.current) {
                 streamRef.current.getTracks().forEach(track => track.stop());
             }
        }
    }, [isFrontCamera, hasPermission]);
    
    // Cleanup deepar on unmount separately
    useEffect(() => {
        return () => {
             if (deepARObj.current) {
                 deepARObj.current.shutdown();
                 deepARObj.current = null;
             }
        }
    }, []);

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
            
            {/* DeepAR Engine Canvas (if activated) */}
            <canvas
                ref={deepARCanvasRef}
                className={`w-full h-full object-cover transform absolute inset-0 ${isFrontCamera ? 'scale-x-[-1]' : ''} ${isDeepARActive ? 'opacity-100 z-10' : 'opacity-0 -z-10'}`}
            />

            {/* Hidden File Input for Gallery */}
            <input 
               type="file" 
               accept="image/*" 
               ref={fileInputRef} 
               className="hidden" 
               onChange={handleFileChange}
            />

            {!isDeepARActive && hasPermission && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform select-none absolute inset-0 ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
                />
            )}
        </div>
    );
});

export default CameraView;
