import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

const BirthdayEffects = ({ name, onComplete }) => {
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);

        // Hide after 7 seconds
        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 7000);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [onComplete]);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none transition-opacity duration-1000">
            <Confetti
                width={dimensions.width}
                height={dimensions.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.12}
                colors={['#FFFC00', '#000000', '#FF0049', '#00E6FF', '#FFFFFF']}
            />
            <div className="flex flex-col items-center animate-bounce mt-10">
                <div className="text-[100px] mb-6 drop-shadow-2xl">🎂🥳🎉</div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-3 tracking-tight drop-shadow-2xl text-center font-sans">
                    Happy Birthday,<br />
                    <span className="text-snapYellow">{name || 'Snapper'}</span>!
                </h1>
            </div>
        </div>
    );
};

export default BirthdayEffects;
