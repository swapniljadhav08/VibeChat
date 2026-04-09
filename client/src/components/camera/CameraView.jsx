import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as deepar from 'deepar';

const CameraView = forwardRef((props, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const deepARCanvasRef = useRef(null);

    const [hasPermission, setHasPermission] = useState(null);
    const [error, setError] = useState('');
    const [isDeepARActive, setIsDeepARActive] = useState(false);
    const [currentFilterName, setCurrentFilterName] = useState('none');

    const deepARObj = useRef(null);
    const isInitializingRef = useRef(false);

   // const DEEPAR_KEY =import.meta.env.VITE_DEEPAR_KEY
    // Overriding the environment variable key to null to bypass local WebGL compatibility issues
    const DEEPAR_KEY = null;

    useImperativeHandle(ref, () => ({
        currentFilter: { name: currentFilterName },
        capturePhoto: async () => {
            // 1. If Deep AR Face Filters are active
            if (isDeepARActive && deepARObj.current) {
                try {
                    // DeepAR has built-in screenshot taking
                    const dataUrl = await deepARObj.current.takeScreenshot();
                    return dataUrl;
                } catch (e) {
                    console.error("DeepAR Snipe Error", e);
                }
            }

            // 2. Fallback Standard HTML5 Video capture
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                // Set canvas dimensions to match video stream
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                // Flip the context horizontally because the video is mirrored via CSS scale-x-[-1]
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);

                // Draw current video frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Get Base64 image data
                return canvas.toDataURL('image/jpeg', 0.8);
            }
            return null;
        },
        toggleFilter: async (filterName) => {
            if (isDeepARActive && deepARObj.current) {
                try {
                    // 1. First, always reset everything so effects don't accidentally stack
                    await deepARObj.current.clearEffect();
                    await deepARObj.current.backgroundBlur(false);

                    // 2. Apply the specific requested DeepAR functionality
                    if (filterName === 'none') {
                        // Already cleared above, do nothing!
                    } else if (filterName === 'background_blur') {
                        // Blur uses a native API instead of a .deepar file
                        await deepARObj.current.backgroundBlur(true, 8);
                    } else {
                        // Standard Face Mask or 3D background file
                        await deepARObj.current.switchEffect(`/effects/${filterName}.deepar`);
                    }
                    setCurrentFilterName(filterName);
                } catch (err) {
                    console.error("Filter Engine Error: ", err);
                }
            }
        }
    }));

    useEffect(() => {
        let isMounted = true;
        let stream = null;

        const startCamera = async () => {
            if (isInitializingRef.current || deepARObj.current) return;

            // If the user has added a DeepAR SDK Key, boot up the filter engine!
            if (DEEPAR_KEY && deepARCanvasRef.current) {
                isInitializingRef.current = true;
                try {
                    console.log("Initializing DeepAR Web Engine...");

                    // MUST SET DIMENSIONS FOR DEEPAR WEBGL TO RENDER PROPERLY
                    const dpr = window.devicePixelRatio || 1;
                    deepARCanvasRef.current.width = window.innerWidth * dpr;
                    deepARCanvasRef.current.height = window.innerHeight * dpr;

                    const deepARInstance = await deepar.initialize({
                        licenseKey: DEEPAR_KEY,
                        canvas: deepARCanvasRef.current,
                        additionalOptions: {
                            cameraConfig: { facingMode: 'user' }
                        }
                    });

                    if (!isMounted) {
                        if (deepARInstance) await deepARInstance.shutdown();
                        isInitializingRef.current = false;
                        return;
                    }

                    deepARObj.current = deepARInstance;
                    setIsDeepARActive(true);
                    setHasPermission(true);
                    isInitializingRef.current = false;
                    return; // Successfully started DeepAR
                } catch (err) {
                    console.error("🔴 DeepAR Init Failed - Falling back to normal camera...", err);
                    isInitializingRef.current = false;
                }
            }

            // Standard Camera Bootup (If DeepAR is off or failed)
            if (isMounted) {
                startNormalCamera();
            }
        };

        const startNormalCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                    audio: false
                });

                if (videoRef.current && isMounted) {
                    videoRef.current.srcObject = stream;
                    setHasPermission(true);
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                if (isMounted) {
                    setHasPermission(false);
                    setError("Camera permission denied or device not found.");
                }
            }
        };

        startCamera();

        // Cleanup
        return () => {
            isMounted = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (deepARObj.current) {
                deepARObj.current.shutdown();
                deepARObj.current = null;
            }
        };
    }, [DEEPAR_KEY]);

    if (hasPermission === false) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 px-6 text-center">
                <span className="text-5xl mb-4">📷</span>
                <h2 className="text-2xl font-bold mb-2">Camera Access Denied</h2>
                <p className="text-gray-400">Please allow camera permissions in your browser settings to use VibeChat.</p>
                <p className="text-red-500 mt-4 text-sm font-mono bg-red-500/10 p-2 rounded">{error}</p>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full bg-black overflow-hidden pointer-events-none">
            {/* DeepAR Engine Canvas (if activated) */}
            <canvas
                ref={deepARCanvasRef}
                className={`w-full h-full object-cover transform scale-x-[-1] absolute inset-0 ${isDeepARActive ? 'opacity-100 z-10' : 'opacity-0 -z-10'}`}
            />

            {/* Standard HTML5 Engine (if DeepAR is currently disabled) */}
            {!isDeepARActive && (
                <>
                    <canvas ref={canvasRef} className="hidden" />
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1] absolute inset-0"
                    />
                </>
            )}
        </div>
    );
});

export default CameraView;
