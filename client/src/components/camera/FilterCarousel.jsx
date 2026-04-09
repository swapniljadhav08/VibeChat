import React, { useEffect } from 'react';

const FILTERS = [
    // Clear
    { id: 'none', label: 'Clear', emoji: '🚫' },

    // Glasses (Gogle)
    { id: 'aviators', label: 'Aviators', emoji: '🕶️' },

    // Animals
    { id: 'dalmatian', label: 'Dalmatian', emoji: '🐶' },
    { id: 'lion', label: 'Lion', emoji: '🦁' },
    { id: 'koala', label: 'Koala', emoji: '🐨' },

    // Backgrounds
    { id: 'background_blur', label: 'Portrait Blur', emoji: '🌫️' },
    { id: 'galaxy_background', label: 'Galaxy BG', emoji: '🌌' }
];

const FilterCarousel = ({ currentFilter, onSelectFilter }) => {
    const listRef = React.useRef(null);

    const handleFilterClick = (f, index) => {
        onSelectFilter(f.id);

        if (listRef.current) {
            const container = listRef.current;
            const element = container.children[index];
            if (element) {
                // Smoothly scroll the clicked element to the center of the screen
                const scrollLeft = element.offsetLeft - (container.clientWidth / 2) + (element.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    };

    // Auto align on mount if we start with an active filter
    useEffect(() => {
        if (listRef.current) {
            const activeIndex = FILTERS.findIndex(f => f.id === currentFilter);
            if (activeIndex >= 0) {
                const container = listRef.current;
                const element = container.children[activeIndex];
                if (element) {
                    const scrollLeft = element.offsetLeft - (container.clientWidth / 2) + (element.clientWidth / 2);
                    container.scrollTo({ left: scrollLeft, behavior: 'instant' });
                }
            }
        }
    }, [currentFilter]);

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-auto z-10 flex flex-col justify-center">
            <div
                ref={listRef}
                className="flex items-center space-x-6 overflow-x-auto scroll-smooth w-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingLeft: 'calc(50vw - 32px)', paddingRight: 'calc(50vw - 32px)' }}
            >
                {FILTERS.map((f, i) => {
                    const isActive = currentFilter === f.id;
                    return (
                        <div
                            key={f.id}
                            className={`flex flex-col items-center justify-center transition-all duration-300 cursor-pointer flex-shrink-0 relative ${isActive ? 'scale-[1.15]' : 'scale-90 opacity-70 hover:opacity-100 hover:scale-100'}`}
                            onClick={() => handleFilterClick(f, i)}
                        >
                            <div className={`rounded-full flex items-center justify-center transition-all w-[64px] h-[64px] border-[3px] border-white/50 bg-black/40 backdrop-blur-md text-3xl shadow-lg`}>
                                {f.emoji}
                            </div>

                            {/* Filter Label below active button */}
                            {isActive && (
                                <span className="absolute -top-10 font-bold text-xs tracking-wide drop-shadow-lg text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap z-50 pointer-events-none">
                                    {f.label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .overflow-x-auto::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </div>
    );
};

export default FilterCarousel;
