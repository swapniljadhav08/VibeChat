import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import useSupercluster from 'use-supercluster';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { ChevronLeft, Ghost, Users, Crosshair, Map as MapIcon, Aperture } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const SnapMap = () => {
    const { authToken, userData } = useAuth();
    const navigate = useNavigate();
    const mapRef = useRef();
    const socketRef = useRef();

    // Map State
    const [viewState, setViewState] = useState({
        longitude: -98.35, // default US center
        latitude: 39.5,
        zoom: 3
    });
    const [mapReady, setMapReady] = useState(false);

    // Data State
    const [friendsLocations, setFriendsLocations] = useState([]);
    const [myPrivacyMode, setMyPrivacyMode] = useState('FRIENDS'); // 'GHOST' or 'FRIENDS'
    
    // User Location tracking
    const watchIdRef = useRef(null);
    const [myLocation, setMyLocation] = useState(null);

    useEffect(() => {
        if (!authToken || !userData) return;

        // Fetch initial map data (friends locs)
        const fetchMapData = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/map/data`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                setFriendsLocations(res.data.users || []);
            } catch (err) {
                console.error("Error fetching map data:", err);
            }
        };

        fetchMapData();

        // Connect Socket
        socketRef.current = io(API_BASE_URL);
        socketRef.current.emit('register_user', userData._id);

        socketRef.current.on('friends_location_update', (update) => {
            // Update friend location actively if they moved
            setFriendsLocations(prev => {
                const isFriend = prev.find(p => p._id === update.userId);
                if (isFriend) {
                    return prev.map(p => p._id === update.userId ? { ...p, location: { lat: update.lat, lng: update.lng, lastUpdated: update.lastUpdated } } : p);
                } else if (update.userId !== userData._id) {
                    // Refetch all to verify if we should see them now
                    fetchMapData();
                }
                return prev;
            });
        });

        // Start watching geolocation
        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition((pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setMyLocation(loc);
                
                // Emit my location
                if (myPrivacyMode !== 'GHOST') {
                    socketRef.current.emit('update_location', {
                        userId: userData._id,
                        lat: loc.lat,
                        lng: loc.lng
                    });
                }
            }, (error) => {
                console.error('Location Error:', error);
            }, { enableHighAccuracy: true });
        }

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [authToken, userData, myPrivacyMode]);

    // Clustering configuration
    const points = friendsLocations.filter(f => f.location && f.location.lng).map(friend => ({
        type: 'Feature',
        properties: { cluster: false, userId: friend._id, category: 'friend', friendData: friend },
        geometry: { type: 'Point', coordinates: [friend.location.lng, friend.location.lat] }
    }));

    if (myLocation && myPrivacyMode !== 'GHOST') {
        points.push({
            type: 'Feature',
            properties: { cluster: false, userId: userData._id, category: 'me', friendData: userData },
            geometry: { type: 'Point', coordinates: [myLocation.lng, myLocation.lat] }
        });
    }

    const bounds = mapRef.current ? mapRef.current.getMap().getBounds().toArray().flat() : null;

    const { clusters, supercluster } = useSupercluster({
        points,
        bounds,
        zoom: viewState.zoom,
        options: { radius: 75, maxZoom: 14 }
    });

    const togglePrivacy = async () => {
        const newMode = myPrivacyMode === 'GHOST' ? 'FRIENDS' : 'GHOST';
        try {
            await axios.post(`${API_BASE_URL}/api/map/privacy`, { mode: newMode }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setMyPrivacyMode(newMode);
            toast.success(newMode === 'GHOST' ? "Ghost Mode Enabled 👻" : "Location Visible to Friends 👀");
        } catch (err) {
            console.error("Privacy update failed", err);
        }
    };

    const recenterMe = () => {
        if (myLocation) {
            setViewState({
                ...viewState,
                longitude: myLocation.lng,
                latitude: myLocation.lat,
                zoom: 14
            });
        } else {
            toast.error("Location not acquired yet.");
        }
    };

    return (
        <div className="h-screen w-screen bg-surface-950 font-sans relative overflow-hidden text-surface-50">
            
            {/* Map Container */}
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                ref={mapRef}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" // Free modern dark map
                onLoad={() => setMapReady(true)}
            >
                {/* Custom Map Interactions */}
                {clusters.map(cluster => {
                    const [longitude, latitude] = cluster.geometry.coordinates;
                    const { cluster: isCluster, point_count: pointCount } = cluster.properties;

                    if (isCluster) {
                        return (
                            <Marker key={`cluster-${cluster.id}`} latitude={latitude} longitude={longitude}>
                                <div
                                    className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white font-extrabold text-lg border-4 border-surface-900 shadow-glow cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => {
                                        const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20);
                                        setViewState({ ...viewState, latitude, longitude, zoom: expansionZoom });
                                    }}
                                >
                                    {pointCount}
                                </div>
                            </Marker>
                        );
                    }

                    // Individual Marker
                    const user = cluster.properties.friendData;
                    const isMe = cluster.properties.category === 'me';
                    return (
                        <Marker key={`marker-${cluster.properties.userId}`} latitude={latitude} longitude={longitude}>
                            <div className={`relative cursor-pointer group hover:z-50 transition-all ${isMe ? 'z-40' : 'z-30'}`}>
                                <div className={`w-14 h-14 rounded-full border-[3px] shadow-glow overflow-hidden ${isMe ? 'border-green-400 bg-green-50' : 'border-primary-500 bg-primary-50'}`}>
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} className="w-full h-full object-cover" alt="avatar" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">😎</div>
                                    )}
                                </div>
                                {/* Label pin */}
                                <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-surface-900/80 backdrop-blur px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-surface-800 shadow-lg pointer-events-none">
                                    <span className="font-bold text-[13px]">{isMe ? 'Me' : user.displayName || user.username}</span>
                                </div>
                            </div>
                        </Marker>
                    );
                })}

            </Map>

            {/* Overlays / UI */}
            
            {/* Header Controls */}
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between pointer-events-none z-50">
                <button onClick={() => navigate('/')} className="w-[46px] h-[46px] flex items-center justify-center bg-surface-900/60 backdrop-blur-xl rounded-full text-white shadow-soft pointer-events-auto hover:bg-surface-800 transition active:scale-95 border border-surface-800">
                    <ChevronLeft size={28} strokeWidth={2.5} className="-ml-1" />
                </button>
            </div>

            {/* Floating Action Menu (Right side) */}
            <div className="absolute top-24 right-5 flex flex-col gap-4 pointer-events-none z-50">
                <button
                    onClick={recenterMe}
                    className="w-[48px] h-[48px] bg-surface-900/80 backdrop-blur-xl rounded-full flex items-center justify-center text-surface-400 border border-surface-700 hover:text-white shadow-soft pointer-events-auto transition active:scale-90 hover:bg-surface-800"
                    title="Recenter Map"
                >
                    <Crosshair size={22} strokeWidth={2.5} />
                </button>
                
                <button
                    onClick={togglePrivacy}
                    className={`w-[48px] h-[48px] backdrop-blur-xl rounded-full flex items-center justify-center border shadow-soft pointer-events-auto transition active:scale-90 relative group ${myPrivacyMode === 'GHOST' ? 'bg-indigo-600/90 text-white border-indigo-500 hover:bg-indigo-500' : 'bg-surface-900/80 text-surface-400 border-surface-700 hover:text-white hover:bg-surface-800'}`}
                    title={myPrivacyMode === 'GHOST' ? "Disable Ghost Mode" : "Enable Ghost Mode"}
                >
                    <Ghost size={22} strokeWidth={2.5} className={myPrivacyMode === 'GHOST' ? 'animate-pulse' : ''} />
                    {myPrivacyMode === 'GHOST' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full border-2 border-surface-950"></div>
                    )}
                </button>
            </div>

            {/* Bottom Floating App Nav Mockup (Optional logic context) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm pointer-events-none z-50">
                <div className="bg-surface-900/80 backdrop-blur-2xl p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-surface-700/50 pointer-events-auto">
                    <div onClick={() => navigate('/chat')} className="flex flex-col items-center justify-center w-12 cursor-pointer text-surface-400 hover:text-white transition">
                        <Users size={24} strokeWidth={2.5} />
                    </div>
                    <div onClick={() => navigate('/')} className="flex flex-col items-center justify-center w-12 cursor-pointer text-surface-400 hover:text-white transition">
                        <Aperture size={32} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col items-center justify-center w-12 cursor-pointer text-primary-500 transition scale-110 drop-shadow-sm">
                        <MapIcon size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SnapMap;
