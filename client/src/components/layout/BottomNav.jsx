import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, MessageSquare, Camera as CameraIcon, Users, Play, Images, Smile, X } from 'lucide-react';
import CaptureButton from '../camera/CaptureButton';
import FilterCarousel from '../camera/FilterCarousel';

const BottomNav = ({ onCapture, onOpenGallery, onToggleFilter, showFilters, currentFilter, onSelectFilter }) => {
    return (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end z-10 w-full pointer-events-none pb-8">

            {/* Capture Controls Row */}
            <div className="relative flex items-center justify-center mb-6 w-full h-[84px] pointer-events-none">

                {/* Background Carousel */}
                {showFilters && (
                    <FilterCarousel
                        currentFilter={currentFilter}
                        onSelectFilter={onSelectFilter}
                    />
                )}

                {/* Left Options (Images) */}
                <div className="absolute left-8 md:left-1/4 z-30 pointer-events-auto">
                    <button onClick={onOpenGallery} className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center hover:bg-surface-800/80 transition-all bg-surface-900/60 backdrop-blur-xl shadow-soft border border-surface-700/50 text-surface-400 hover:text-white cursor-pointer">
                        <Images size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Main Capture Button ("The Bangle") */}
                <div className="z-30 pointer-events-auto hover:scale-105 transition-transform duration-300">
                    <CaptureButton onCapture={onCapture} isFilterMode={showFilters} />
                </div>

                {/* Right Options (Smile / Close) */}
                <div className="absolute right-8 md:right-1/4 z-30 pointer-events-auto">
                    {showFilters ? (
                        <button
                            onClick={onToggleFilter}
                            className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center hover:bg-surface-800/80 transition-all bg-surface-900/60 backdrop-blur-xl shadow-soft border border-surface-700/50 text-surface-400 hover:text-white"
                        >
                            <X size={20} strokeWidth={2} />
                        </button>
                    ) : (
                        <button
                            onClick={onToggleFilter}
                            className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center hover:bg-surface-800/80 transition-all bg-surface-900/60 backdrop-blur-xl shadow-soft border border-surface-700/50 text-surface-400 hover:text-white"
                        >
                            <Smile size={20} strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Tab Bar (Floating Dock Style) */}
            <div className="pointer-events-auto z-30">
                <div className="flex bg-surface-900/80 backdrop-blur-2xl border border-surface-700/50 rounded-2xl px-6 py-3 items-center space-x-8 shadow-soft">
                    <Link to="/map" className="text-surface-400 hover:text-primary-500 transition-colors tooltip tooltip-top" data-tip="Map">
                        <MapPin size={22} strokeWidth={2} />
                    </Link>
                    <Link to="/chat" className="text-surface-400 hover:text-primary-500 transition-colors tooltip tooltip-top" data-tip="Chat">
                        <MessageSquare size={22} strokeWidth={2} />
                    </Link>
                    <div className="w-px h-6 bg-surface-700/50"></div>
                    <button className="text-primary-500 hover:text-primary-400 transition-colors tooltip tooltip-top pointer-events-none" data-tip="Camera">
                        <CameraIcon size={22} strokeWidth={2} />
                    </button>
                    <div className="w-px h-6 bg-surface-700/50"></div>
                    <button className="text-surface-400 hover:text-primary-500 transition-colors tooltip tooltip-top" data-tip="Friends">
                        <Users size={22} strokeWidth={2} />
                    </button>
                    <button className="text-surface-400 hover:text-primary-500 transition-colors tooltip tooltip-top" data-tip="Stories">
                        <Play size={22} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BottomNav;
