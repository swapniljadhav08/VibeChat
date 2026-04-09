import React, { useRef, useState, useEffect } from 'react';
import { X, Type, PenTool, StickyNote, Scissors, Link2, Download, Send, Play, Undo2 } from 'lucide-react';
import Draggable from 'react-draggable';
import { Rnd } from 'react-rnd';
import html2canvas from 'html2canvas';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';

const COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#0099FF', '#5856D6', '#FF2D55'];

const DraggableEmoji = ({ e }) => {
    const nodeRef = useRef(null);
    return (
        <Draggable bounds="parent" nodeRef={nodeRef}>
            <div ref={nodeRef} className="absolute z-20 text-6xl cursor-move" style={{ textShadow: '0px 4px 6px rgba(0,0,0,0.5)', top: '40%', left: '40%' }}>
                {e.emoji}
            </div>
        </Draggable>
    );
};

const DraggableText = ({ t, updateText }) => {
    return (
        <Rnd
            default={{ x: window.innerWidth * 0.1, y: window.innerHeight * 0.3, width: 250, height: 80 }}
            bounds="parent"
            enableResizing={{ top: false, right: false, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }}
            className="z-30 group"
            minWidth={100}
            minHeight={50}
        >
            <div className="w-full h-full flex flex-col items-center justify-center relative cursor-move">
                {/* Visual Resize Corners shown on Hover to tell the user they can grab it! */}
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-white/50 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-white/50 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white/50 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white/50 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />

                <textarea
                    className="w-full h-full bg-black/50 text-center font-black font-sans rounded-2xl outline-none placeholder-white/80 border border-white/20 shadow-2xl focus:border-white/50 transition-colors resize-none overflow-hidden flex items-center p-2"
                    style={{
                        color: t.color,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)', // simplified to standard hex/rgba so html2canvas doesn't fail parsing variables
                        fontSize: 'clamp(16px, 8vw, 42px)',
                        lineHeight: '1.2'
                    }}
                    value={t.text}
                    onChange={(evt) => updateText(t.id, evt.target.value)}
                    autoFocus
                />
            </div>
        </Rnd>
    );
};

const PhotoPreview = ({ photoUrl, onDiscard, onSend, isUploading }) => {
    const wrapRef = useRef(null);
    const canvasRef = useRef(null);

    const [activeTool, setActiveTool] = useState('none'); // 'pen', 'text', 'none'
    const [color, setColor] = useState(COLORS[2]);
    const [texts, setTexts] = useState([]);
    const [emojis, setEmojis] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Canvas dimensions setup
    useEffect(() => {
        const initCanvas = () => {
            if (canvasRef.current && wrapRef.current) {
                const rect = wrapRef.current.getBoundingClientRect();
                // Assure we get dimensions even if initially 0
                canvasRef.current.width = rect.width || window.innerWidth;
                canvasRef.current.height = rect.height || window.innerHeight;
            }
        };
        initCanvas();
        // Give layout a tiny moment to settle
        const timeout = setTimeout(initCanvas, 150);
        return () => clearTimeout(timeout);
    }, [photoUrl]);

    // --- DRAWING LOGIC ---
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const getCoord = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        // Handle touch and mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handlePointerDown = (e) => {
        if (activeTool !== 'pen') return;
        isDrawing.current = true;
        const pos = getCoord(e);
        lastPos.current = pos;

        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    };

    const handlePointerMove = (e) => {
        if (!isDrawing.current || activeTool !== 'pen') return;
        const pos = getCoord(e);
        const ctx = canvasRef.current.getContext('2d');

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        lastPos.current = pos;
    };

    const handlePointerUp = () => {
        isDrawing.current = false;
    };

    // --- TEXT LOGIC ---
    const addText = () => {
        setActiveTool('none');
        setTexts([...texts, { id: Date.now(), text: 'Tap to type...', color }]);
    };

    const updateText = (id, newText) => {
        setTexts(texts.map(t => t.id === id ? { ...t, text: newText } : t));
    };

    // --- EMOJI LOGIC ---
    const handleEmojiClick = (emojiData) => {
        setEmojis([...emojis, { id: Date.now(), emoji: emojiData.emoji }]);
        setShowEmojiPicker(false);
        setActiveTool('none');
    };

    const clearCanvas = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setTexts([]);
        setEmojis([]);
    };

    // --- EXPORT COMPOSITE IMAGE ---
    const generateFinalImage = async () => {
        setIsExporting(true);
        setActiveTool('none');

        // WORKAROUND: Remove "backdrop-blur" classes temporarily so html2canvas doesn't crash on OKLAB colors.
        const nodesWithBlur = wrapRef.current.querySelectorAll('.backdrop-blur-md, .backdrop-blur-xl, .backdrop-blur-2xl');
        nodesWithBlur.forEach(node => {
            node.classList.remove('backdrop-blur-md', 'backdrop-blur-xl', 'backdrop-blur-2xl');
        });

        try {
            // html2canvas reads the DOM elements and composites them
            // 'ignoreElements' ensures the sidebars/topbars aren't trapped in the snap screenshot!
            const canvas = await html2canvas(wrapRef.current, {
                useCORS: true,
                scale: 1, // Scaled to 1 to prevent ultra-massive base64 strings breaking the backend upload limit
                backgroundColor: '#020617', // Match new bg-surface-950
                ignoreElements: (element) => element.classList.contains('ignore-capture')
            });
            // Output small ultra fast jpeg
            return canvas.toDataURL('image/jpeg', 0.6);
        } catch (err) {
            console.error("Export Error", err);
            toast.error("Failed to render final snap.");
            return photoUrl;
        } finally {
            // Restore blurry components
            nodesWithBlur.forEach(node => {
                // Ensure backdrop blurs come back cleanly
                node.classList.add('backdrop-blur-md');
            });
            setIsExporting(false);
        }
    };

    const handleDownloadClick = async () => {
        const finalImage = await generateFinalImage();
        const link = document.createElement('a');
        link.href = finalImage;
        link.download = `vibechat_${new Date().getTime()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Saved to Camera Roll!");
    };

    const handleSendClick = async () => {
        // Force composite the image with what was drawn!
        const finalImage = await generateFinalImage();
        onSend(finalImage);
    };

    // If typing text, allow it to capture pointer up cleanly
    return (
        <div className="absolute inset-0 w-full h-full bg-black z-50 flex flex-col items-center justify-between animate-in fade-in zoom-in-95 duration-200">

            {/* 📸 WRAPPER FOR EXPORT / CANVAS 📸 */}
            <div
                ref={wrapRef}
                className="absolute inset-x-0 inset-y-0 w-full h-full overflow-hidden"
                style={{ touchAction: activeTool === 'pen' ? 'none' : 'auto' }}
            >
                {/* 1. Underlying Snap Object */}
                <img
                    src={photoUrl}
                    alt="Captured Snap"
                    className="w-full h-full object-cover rounded-xl shadow-2xl scale-[0.98] mt-2 block"
                />

                {/* 2. Freehand Draw Overlay Layer */}
                <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 w-full h-full z-10 ${activeTool === 'pen' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                />

                {/* 3. Draggable Emojis Layer */}
                {emojis.map(e => (
                    <DraggableEmoji key={e.id} e={e} />
                ))}

                {/* 4. Draggable Texts Layer */}
                {texts.map(t => (
                    <DraggableText key={t.id} t={t} updateText={updateText} />
                ))}
            </div>

            {/* --- 🎨 UI LAYER OVERLAYS (IGNORED IN COMPOSITE EXPORT) 🎨 --- */}

            {/* Top Controls - Discard & Clear */}
            <div className="ignore-capture absolute top-0 left-0 right-0 p-6 flex justify-between z-[60] pt-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <button
                    onClick={onDiscard}
                    disabled={isExporting || isUploading}
                    className="w-[44px] h-[44px] bg-surface-900/60 backdrop-blur-xl rounded-xl flex items-center justify-center text-surface-400 transition-all shadow-soft active:scale-90 hover:bg-surface-800 hover:text-white border border-surface-700/50 pointer-events-auto"
                >
                    <X size={20} strokeWidth={2} />
                </button>

                {(texts.length > 0 || emojis.length > 0) && (
                    <button
                        onClick={clearCanvas}
                        className="w-[44px] h-[44px] bg-surface-900/60 backdrop-blur-xl rounded-xl flex items-center justify-center text-surface-400 transition-all shadow-soft active:scale-90 hover:bg-surface-800 hover:text-white border border-surface-700/50 pointer-events-auto"
                    >
                        <Undo2 size={18} strokeWidth={2} />
                    </button>
                )}
            </div>

            {/* Right Side Tools Panel */}
            <div className={`ignore-capture absolute top-[100px] right-4 flex flex-col gap-4 z-[60] items-center transition-all ${isExporting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <button onClick={addText} className="w-[44px] h-[44px] bg-surface-900/60 backdrop-blur-xl rounded-xl flex items-center justify-center text-surface-400 shadow-soft active:scale-90 transition-all hover:bg-surface-800 hover:text-white border border-surface-700/50 group">
                    <Type size={18} strokeWidth={2} className="group-active:text-primary-400" />
                </button>
                <button onClick={() => setActiveTool(activeTool === 'pen' ? 'none' : 'pen')} className={`w-[44px] h-[44px] backdrop-blur-xl rounded-xl flex items-center justify-center shadow-soft active:scale-90 transition-all border ${activeTool === 'pen' ? 'bg-primary-600 border-primary-500/50 text-white' : 'bg-surface-900/60 border-surface-700/50 text-surface-400 hover:bg-surface-800 hover:text-white'}`}>
                    <PenTool size={18} strokeWidth={2} />
                </button>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`w-[44px] h-[44px] backdrop-blur-xl rounded-xl flex items-center justify-center shadow-soft active:scale-90 transition-all border ${showEmojiPicker ? 'bg-primary-600 border-primary-500/50 text-white' : 'bg-surface-900/60 border-surface-700/50 text-surface-400 hover:bg-surface-800 hover:text-white'}`}>
                    <StickyNote size={18} strokeWidth={2} />
                </button>
                <button onClick={() => toast("Snapping to Face coming soon!")} className="w-[44px] h-[44px] bg-surface-900/60 backdrop-blur-xl rounded-xl flex items-center justify-center text-surface-400 shadow-soft active:scale-90 transition-all hover:bg-surface-800 hover:text-white border border-surface-700/50">
                    <Scissors size={18} strokeWidth={2} />
                </button>
                <button onClick={() => toast("Links feature pending.")} className="w-[44px] h-[44px] bg-surface-900/60 backdrop-blur-xl rounded-xl flex items-center justify-center text-surface-400 shadow-soft active:scale-90 transition-all hover:bg-surface-800 hover:text-white border border-surface-700/50">
                    <Link2 size={18} strokeWidth={2} />
                </button>
            </div>

            {/* Floating Color Palette Picker */}
            {activeTool === 'pen' && (
                <div className="ignore-capture absolute top-[380px] right-5 flex flex-col gap-2 z-[60] bg-black/30 p-2 rounded-full backdrop-blur-2xl shadow-xl border border-white/10 animate-in slide-in-from-right-4">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${color === c ? 'scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)] border-2 border-white' : 'border border-black/40 opacity-80 hover:opacity-100'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            )}

            {/* Emoji Picker Modal Backdrop */}
            {showEmojiPicker && (
                <div className="ignore-capture absolute inset-0 z-[65]" onClick={() => setShowEmojiPicker(false)}>
                    {/* Emoji box positioned correctly near the button */}
                    <div onClick={e => e.stopPropagation()} className="absolute top-[220px] right-16 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-200">
                        <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" skinTonesDisabled width={280} height={350} />
                    </div>
                </div>
            )}

            {/* Bottom Primary Controls */}
            <div className={`ignore-capture absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end z-[60] w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-24 pb-8 transition-all pointer-events-none ${isExporting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                <div className="flex gap-3 pointer-events-auto">
                    <button
                        onClick={handleDownloadClick}
                        disabled={isExporting || isUploading}
                        className="w-[50px] h-[50px] bg-surface-900/60 backdrop-blur-xl rounded-2xl flex items-center justify-center text-surface-50 shadow-soft active:scale-90 transition-all hover:bg-surface-800 border border-surface-700/50"
                    >
                        {isExporting ? <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /> : <Download size={22} strokeWidth={2} />}
                    </button>
                </div>

                {/* Main Send Button */}
                <button
                    onClick={handleSendClick}
                    disabled={isExporting || isUploading}
                    className={`pointer-events-auto flex items-center justify-between space-x-3 bg-primary-600 text-white pl-5 pr-2 py-2 rounded-2xl font-bold text-[16px] transition-all shadow-glow border border-primary-500/50 ${isUploading || isExporting ? 'opacity-70 cursor-wait' : 'active:scale-95 hover:bg-primary-500'}`}
                >
                    <span className="tracking-tight">{isUploading || isExporting ? 'PROCESSING...' : 'Send'}</span>
                    {!(isUploading || isExporting) &&
                        <div className="bg-white/20 w-9 h-9 rounded-xl flex items-center justify-center ml-2 group-hover:bg-white/30 transition-colors shadow-sm">
                            <Send size={16} className="ml-1 text-white" strokeWidth={2.5} />
                        </div>
                    }
                </button>
            </div>
        </div>
    );
};

export default PhotoPreview;
