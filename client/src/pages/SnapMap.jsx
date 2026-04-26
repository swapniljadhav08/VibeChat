import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { ChevronLeft, Ghost, Crosshair, Map as MapIcon, Users, Aperture, X, Send, Plus, Minus, Compass, Layers, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const MapController = ({ myLocation }) => {
    const map = useMap();
    useEffect(() => {
        if (myLocation && !map.hasFlown) {
            map.flyTo([myLocation.lat, myLocation.lng], 14, { animate: true, duration: 1.5 });
            map.hasFlown = true;
        }
    }, [myLocation, map]);
    return null;
};

const FlyToControl = ({ targetLoc, trigger }) => {
    const map = useMap();
    useEffect(() => {
        if (targetLoc) {
            map.flyTo([targetLoc.lat, targetLoc.lng], 16, { animate: true, duration: 1.5 });
        }
    }, [targetLoc, trigger, map]);
    return null;
};

const SnapMap = () => {
    const { authToken, userData } = useAuth();
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const watchIdRef = useRef(null);

    const [mapReady, setMapReady] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    
    // Map Type Config
    const mapTypes = ['dark', 'street', 'satellite', 'light'];
    const [mapType, setMapType] = useState('dark');
    
    const [friendsLocations, setFriendsLocations] = useState([]);
    const [myPrivacyMode, setMyPrivacyMode] = useState('FRIENDS');
    const [myLocation, setMyLocation] = useState(null);
    
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(true);

    const [selectedFriend, setSelectedFriend] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [flyToLoc, setFlyToLoc] = useState(null);
    const [flyTrigger, setFlyTrigger] = useState(0);

    const checkPermission = () => {
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted') {
                    setShowPermissionPrompt(false);
                    setPermissionGranted(true);
                    startTracking();
                } else if (result.state === 'prompt') {
                    setShowPermissionPrompt(true);
                } else {
                    toast.error("Location access denied.");
                    setMyPrivacyMode('GHOST');
                    setShowPermissionPrompt(false);
                }
            });
        } else {
             setShowPermissionPrompt(true);
        }
    };

    useEffect(() => {
        checkPermission();
        return () => {
             if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
             if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const enableLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setShowPermissionPrompt(false);
                setPermissionGranted(true);
                setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                startTracking();
            },
            (err) => {
                toast.error("Location permission denied. Running in Ghost Mode.");
                setMyPrivacyMode('GHOST');
                setShowPermissionPrompt(false);
            }
        );
    };

    const startTracking = () => {
        if (!navigator.geolocation) return;
        
        watchIdRef.current = navigator.geolocation.watchPosition((pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setMyLocation(loc);
            
            if (myPrivacyMode !== 'GHOST' && socketRef.current && userData) {
                socketRef.current.emit('update_location', {
                    userId: userData._id,
                    lat: loc.lat,
                    lng: loc.lng
                });
            }
        }, (err) => console.error(err), { enableHighAccuracy: true });
    };

    useEffect(() => {
        if (!authToken || !userData) return;

        const fetchMapData = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/map/data`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                setFriendsLocations(res.data.users || []);
            } catch (err) {
                console.error("Fetch friends err:", err);
            }
        };
        fetchMapData();

        socketRef.current = io(API_BASE_URL);
        socketRef.current.emit('register_user', userData._id);

        socketRef.current.on('friends_location_update', (update) => {
            setFriendsLocations(prev => {
                const exists = prev.find(p => p._id === update.userId);
                if (exists) {
                    return prev.map(p => p._id === update.userId ? { ...p, location: { lat: update.lat, lng: update.lng, lastUpdated: update.lastUpdated } } : p);
                } else if (update.userId !== userData._id) {
                    fetchMapData();
                }
                return prev;
            });
        });

    }, [authToken, userData]);

    const togglePrivacy = async () => {
        const newMode = myPrivacyMode === 'GHOST' ? 'FRIENDS' : 'GHOST';
        try {
            await axios.post(`${API_BASE_URL}/api/map/privacy`, { mode: newMode }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setMyPrivacyMode(newMode);
            toast.success(newMode === 'GHOST' ? "Ghost Mode Enabled 👻" : "Location Visible to Friends 👀", { style: { borderRadius: '200px', background: '#333', color: '#fff' }});
            
            if (newMode === 'FRIENDS' && myLocation) {
                socketRef.current.emit('update_location', {
                    userId: userData._id,
                    lat: myLocation.lat,
                    lng: myLocation.lng
                });
            }

        } catch (err) {
            console.error("Privacy update fail:", err);
        }
    };

    const recenterMe = () => {
        if (myLocation) {
            setFlyToLoc(myLocation);
            setFlyTrigger(prev => prev + 1);
        } else {
            toast.error("Location not acquired yet.");
        }
    };

    const handleFriendClick = (friend) => {
        setSelectedFriend(friend);
        if (friend.location) {
            setFlyToLoc(friend.location);
            setFlyTrigger(prev => prev + 1);
        }
    };

    const handleZoomIn = () => mapInstance?.zoomIn();
    const handleZoomOut = () => mapInstance?.zoomOut();
    const handleResetView = () => mapInstance?.setView([39.5, -98.35], 3);

    const cycleMapType = () => {
        setMapType(prev => {
            const nextIdx = (mapTypes.indexOf(prev) + 1) % mapTypes.length;
            const newType = mapTypes[nextIdx];
            toast.success(`${newType.charAt(0).toUpperCase() + newType.slice(1)} View`, { icon: '🗺️', style: { borderRadius: '200px', background: '#333', color: '#fff' } });
            return newType;
        });
    };

    const getMapUrl = () => {
        switch(mapType) {
            case 'light': return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
            case 'street': return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
            case 'satellite': return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
            case 'dark':
            default: return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
        }
    };

    const handleQuickChat = async () => {
        if (!chatInput.trim() || !selectedFriend) return;
        try {
           const res = await axios.post(`${API_BASE_URL}/api/chat`, { participantId: selectedFriend._id }, { headers: { Authorization: `Bearer ${authToken}` } });
           socketRef.current.emit('send_message', {
                chatId: res.data.chat._id,
                senderId: userData._id,
                messageType: 'text',
                content: chatInput,
                expiresIn: 0
           });
           toast.success("Message sent! ✨", { style: { borderRadius: '200px', background: '#333', color: '#fff' }});
           setChatInput('');
           setSelectedFriend(null);
        } catch(err) {
           toast.error("Failed to send message.");
        }
    };

    const createCustomIcon = (url, mode) => {
        const isGhost = mode === 'GHOST';
        const borderColor = mode === 'ME' ? (isGhost ? 'border-gray-500' : 'border-[#00E5FF]') : 'border-[#7F5AF0]';
        const shadow = mode === 'ME' ? (isGhost ? '' : 'shadow-[0_0_15px_#00E5FF]') : 'shadow-[0_0_15px_#7F5AF0]';
        
        const ring = !isGhost ? `<div style="position: absolute; inset: -0.4rem; border: 2px solid ${mode === 'ME' ? '#00E5FF' : '#7F5AF0'}; border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.6;"></div>` : '';
        const fallback = "😎";

        return L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 9999px; border: 3px solid ${mode === 'ME' ? (isGhost ? '#6B7280' : '#00E5FF') : '#7F5AF0'}; background-color: #0F0F14; box-shadow: ${mode === 'ME' ? (isGhost ? 'none' : '0 0 15px #00E5FF') : '0 0 15px #7F5AF0'}; transition: all 0.3s ease;">
                    ${ring}
                    <div style="width: 100%; height: 100%; border-radius: 9999px; overflow: hidden; background-color: #1F2937; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 10; position: relative;">
                        ${url ? `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;"/>` : fallback}
                    </div>
                </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22]
        });
    };

    return (
        <div className="h-screen w-screen bg-[#0F0F14] font-sans relative flex flex-col text-white overflow-hidden selection:bg-[#7F5AF0]/30 selection:text-white">
            
            {/* Fullscreen Map Layer (z-0) */}
            <div className={`absolute inset-0 z-0 ${showPermissionPrompt ? 'opacity-0' : 'opacity-100'} transition-opacity duration-1000`}>
                <div className="w-full h-full [&_.leaflet-control-attribution]:hidden [&_.leaflet-control-zoom]:hidden bg-transparent">
                    <MapContainer 
                        center={[39.5, -98.35]} 
                        zoom={3} 
                        zoomControl={false}
                        className="w-full h-full"
                        whenReady={(e) => { setMapReady(true); setMapInstance(e.target); }}
                        style={{ backgroundColor: mapType === 'light' ? '#E5E7EB' : '#0F0F14' }}
                    >
                        <TileLayer url={getMapUrl()} attribution="" />
                        
                        <MapController myLocation={myLocation} />
                        <FlyToControl targetLoc={flyToLoc} trigger={flyTrigger} />

                        {myLocation && (
                            <Marker 
                                position={[myLocation.lat, myLocation.lng]} 
                                icon={createCustomIcon(userData?.photoURL, myPrivacyMode === 'GHOST' ? 'GHOST' : 'ME')}
                            />
                        )}

                        {friendsLocations.map(friend => {
                            if (!friend.location || !friend.location.lat) return null;
                            return (
                                <Marker 
                                    key={friend._id}
                                    position={[friend.location.lat, friend.location.lng]}
                                    icon={createCustomIcon(friend.photoURL, 'FRIEND')}
                                    eventHandlers={{ click: () => handleFriendClick(friend) }}
                                />
                            );
                        })}
                    </MapContainer>
                </div>
            </div>

            {/* Absolute Fullscreen Overlay for Permissions (z-100) */}
            <AnimatePresence>
                {showPermissionPrompt && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-[#0F0F14]/90 backdrop-blur-xl flex items-center justify-center p-6">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#7F5AF0]/20 to-[#00E5FF]/20 z-0 pointer-events-none opacity-50"></div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-[#00E5FF]/10 text-[#00E5FF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,229,255,0.3)]">
                                    <Crosshair size={40} strokeWidth={2} />
                                </div>
                                <h2 className="text-2xl font-extrabold mb-3 tracking-tight">Find Your Vibe</h2>
                                <p className="text-white/60 mb-8 font-medium text-[15px] leading-relaxed">Allow VibeChat to securely use your location to drop you onto the map.</p>
                                <button onClick={enableLocation} className="w-full bg-gradient-to-r from-[#7F5AF0] to-[#00E5FF] py-3.5 rounded-2xl font-bold text-lg tracking-wide shadow-[0_5px_20px_rgba(127,90,240,0.4)] mb-4 active:scale-95 transition-all">Enable Location</button>
                                <button onClick={() => { setShowPermissionPrompt(false); setMyPrivacyMode('GHOST'); }} className="text-white/50 hover:text-white font-bold text-[14px] underline underline-offset-4 tracking-wide transition-colors">Continue in Ghost Mode</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Overlay Header (z-40) */}
            <header className="absolute top-0 inset-x-0 w-full px-5 py-4 pt-[max(env(safe-area-inset-top),20px)] flex justify-between items-center z-[40] pointer-events-none">
                <button onClick={() => navigate('/')} className="pointer-events-auto w-11 h-11 flex items-center justify-center bg-white/5 rounded-full text-white shadow-lg hover:bg-white/10 transition-all active:scale-90 border border-white/10 backdrop-blur-md">
                    <ChevronLeft size={28} strokeWidth={2.5} className="-ml-1" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-extrabold text-[22px] tracking-tight text-white drop-shadow-md">Vibe Map</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={togglePrivacy} className={`pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center border shadow-lg transition-all active:scale-90 backdrop-blur-md relative group ${myPrivacyMode === 'GHOST' ? 'bg-[#7F5AF0]/90 text-white border-[#7F5AF0] shadow-[0_0_20px_rgba(127,90,240,0.5)]' : 'bg-[#0F0F14]/60 text-white/70 border-white/10 hover:text-white'}`}>
                        <Ghost size={20} strokeWidth={2.5} className={myPrivacyMode === 'GHOST' ? 'animate-pulse' : ''} />
                    </button>
                </div>
            </header>

            {/* Smart Map Controls Floating on Right (z-40) */}
            <div className={`absolute right-4 top-[45%] -translate-y-1/2 flex flex-col gap-2 z-[40] ${showPermissionPrompt ? 'hidden' : ''}`}>
                <div className="flex flex-col bg-[#0F0F14]/70 backdrop-blur-xl rounded-[20px] border border-white/10 shadow-2xl p-1.5 gap-1.5 pointer-events-auto">
                    <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center rounded-[14px] text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all">
                        <Plus size={20} strokeWidth={2.5} />
                    </button>
                    <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center rounded-[14px] text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all">
                        <Minus size={20} strokeWidth={2.5} />
                    </button>
                    <div className="w-full h-px bg-white/10 my-0.5"></div>
                    <button onClick={handleResetView} className="w-10 h-10 flex items-center justify-center rounded-[14px] text-white/70 hover:text-[#00E5FF] hover:bg-white/10 active:scale-90 transition-all" title="View World">
                        <Compass size={20} strokeWidth={2.5} />
                    </button>
                    <button onClick={recenterMe} className="w-10 h-10 flex items-center justify-center rounded-[14px] text-white/70 hover:text-[#00E5FF] hover:bg-white/10 active:scale-90 transition-all" title="My Location">
                        <Crosshair size={20} strokeWidth={2.5} />
                    </button>
                    <div className="w-full h-px bg-white/10 my-0.5"></div>
                    <button onClick={cycleMapType} className="w-10 h-10 flex items-center justify-center rounded-[14px] text-[#7F5AF0] hover:text-[#00E5FF] hover:bg-white/10 active:scale-90 transition-all" title="Change Map Layer">
                        <Layers size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Bottom Overlay Area (z-40) - Carousel & Nav Menu */}
            <div className="absolute bottom-6 inset-x-0 flex flex-col items-center pointer-events-none z-[40] w-full pb-[env(safe-area-inset-bottom)]">
                
                {/* User Row (Carousel) */}
                <div className="w-full px-2 mb-5">
                    {friendsLocations.length > 0 && mapReady ? (
                        <div className="w-full overflow-x-auto hide-scrollbar px-3 flex gap-4 snap-x snap-mandatory pointer-events-auto">
                            {friendsLocations.map(f => {
                                if (!f.location || !f.location.lat) return null;
                                const isSelected = selectedFriend?._id === f._id;
                                return (
                                    <motion.div 
                                        whileHover={{ scale: 1.03 }} 
                                        whileTap={{ scale: 0.95 }} 
                                        key={f._id} 
                                        onClick={() => handleFriendClick(f)} 
                                        className={`shrink-0 w-[85px] py-3 rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all snap-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] border relative group backdrop-blur-xl ${isSelected ? 'bg-gradient-to-b from-[#7F5AF0]/30 to-[#0F0F14]/90 border-[#7F5AF0]' : 'bg-[#0F0F14]/70 border-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
                                        
                                        <div className={`w-[50px] h-[50px] rounded-full border-2 overflow-hidden mb-2 transition-colors ${isSelected ? 'border-white' : 'border-transparent group-hover:border-white/30'} shadow-[0_5px_15px_rgba(0,0,0,0.3)] bg-gray-800`}>
                                            {f.photoURL ? <img src={f.photoURL} className="w-full h-full object-cover"/> : <div className="text-xl w-full h-full flex items-center justify-center">😎</div>}
                                        </div>
                                        <h3 className="font-bold text-[11px] text-white truncate w-full text-center px-1">{f.displayName?.split(' ')[0] || f.username}</h3>
                                        <div className="flex items-center gap-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <Zap size={10} className="text-[#00E5FF]" />
                                            <span className="text-[9px] font-bold text-[#00E5FF] uppercase tracking-wider">Fly</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-full px-4 flex justify-center pointer-events-auto">
                            <div className="bg-[#0F0F14]/70 rounded-3xl p-4 w-full max-w-sm flex items-center justify-center text-white/40 text-sm font-medium border border-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                Waiting for friends to drop in...
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Global App Navigation Bar */}
                <div className="mb-2 w-[90%] max-w-[360px] bg-[#0F0F14]/90 backdrop-blur-3xl p-[14px] rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center justify-between border border-white/10 px-8 relative overflow-hidden pointer-events-auto">
                     <div className="absolute top-1/2 left-0 w-full h-1/2 bg-[#00E5FF]/5 blur-[20px] rounded-full pointer-events-none"></div>
                     <div onClick={() => navigate('/chat')} className="flex flex-col items-center justify-center w-12 cursor-pointer text-white/40 hover:text-white transition-all active:scale-90"><Users size={26} strokeWidth={2.5} /></div>
                     <div onClick={() => navigate('/')} className="flex flex-col items-center justify-center w-12 cursor-pointer text-white/40 hover:text-white transition-all active:scale-90"><Aperture size={34} strokeWidth={2.5} /></div>
                     <div className="flex flex-col items-center justify-center w-12 cursor-pointer text-[#00E5FF] transition-all active:scale-90 drop-shadow-[0_0_8px_#00E5FF]"><MapIcon size={26} strokeWidth={2.5} /></div>
                </div>
            </div>

            {/* Bottom Sheet Modal - Selected Friend Quick Chat */}
            <AnimatePresence>
                {selectedFriend && (
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute bottom-0 inset-x-0 h-auto bg-[#1A1A24]/95 backdrop-blur-3xl z-[60] border-t border-white/10 rounded-t-[40px] shadow-[0_-30px_60px_rgba(0,0,0,0.8)] pb-[max(env(safe-area-inset-bottom),24px)] flex flex-col pointer-events-auto">
                        <div className="w-full flex justify-center pt-5 pb-3">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors cursor-pointer" onClick={() => setSelectedFriend(null)}></div>
                        </div>
                        <div className="px-6 pb-4 pt-2">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                     <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border-2 border-[#7F5AF0] shadow-[0_0_20px_rgba(127,90,240,0.5)]">
                                         {selectedFriend.photoURL ? <img src={selectedFriend.photoURL} className="w-full h-full object-cover"/> : <div className="text-3xl w-full h-full flex items-center justify-center">😎</div>}
                                     </div>
                                     <div>
                                         <h2 className="text-[22px] font-extrabold tracking-tight text-white">{selectedFriend.displayName || selectedFriend.username}</h2>
                                         <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></div>
                                            <p className="text-[#00E5FF] font-semibold text-[12px] uppercase tracking-widest">Active Now</p>
                                         </div>
                                     </div>
                                </div>
                                <button onClick={() => setSelectedFriend(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full active:scale-90 transition-all border border-white/5"><X size={20} className="text-white/70"/></button>
                            </div>
                            
                            <div className="w-full bg-[#0F0F14] border border-white/10 rounded-3xl p-1.5 flex items-center shadow-inner focus-within:border-[#00E5FF]/40 focus-within:shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-all">
                                <input 
                                    type="text" 
                                    placeholder={`Chat with ${selectedFriend.displayName?.split(' ')[0] || selectedFriend.username}...`} 
                                    value={chatInput} 
                                    onChange={e => setChatInput(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleQuickChat()} 
                                    className="flex-1 bg-transparent border-none outline-none text-white px-5 py-3 font-medium text-[15px] placeholder-white/30" 
                                />
                                <button 
                                    onClick={handleQuickChat} 
                                    disabled={!chatInput.trim()}
                                    className={`w-[46px] h-[46px] rounded-full flex items-center justify-center shadow-lg transition-all mx-1 shrink-0 ${chatInput.trim() ? 'bg-gradient-to-r from-[#7F5AF0] to-[#00E5FF] active:scale-90 text-white' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                                >
                                    <Send size={18} className="ml-1" strokeWidth={2.5}/>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SnapMap;
