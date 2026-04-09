import React from 'react';

const CaptureButton = ({ onCapture, isFilterMode }) => {
    return (
        <div
            className="w-[84px] h-[84px] rounded-full border-[5px] border-white flex items-center justify-center hover:scale-[1.03] transition-transform cursor-pointer shadow-lg mx-4 z-30 pointer-events-auto bg-transparent relative"
            onClick={onCapture}
        >
            <div className={`w-[66px] h-[66px] rounded-full transition-colors pointer-events-none ${isFilterMode ? 'bg-transparent' : 'bg-white/10 backdrop-blur-sm hover:bg-white/30'}`} />
        </div>
    );
};

export default CaptureButton;
