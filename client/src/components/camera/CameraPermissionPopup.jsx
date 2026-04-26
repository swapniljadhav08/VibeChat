import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';

const CameraPermissionPopup = ({ onAllow, isDenied }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm glass bg-[var(--color-base-dark)]/90 p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center shadow-2xl"
      >
        <div className="flex gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-neon-purple)] shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Camera size={32} />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-neon-blue)] shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <ImageIcon size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          {isDenied ? 'Permission Denied' : 'Camera & Gallery'}
        </h2>
        
        <p className="text-gray-400 font-medium mb-8">
          {isDenied 
            ? "We need camera access to capture snaps. Please allow permissions in your browser settings to continue."
            : "We need camera & gallery access to capture and send snaps to your friends."}
        </p>

        <div className="w-full">
          <GlassButton variant="neon" onClick={onAllow}>
            {isDenied ? 'Grant Permission' : 'Allow Access'}
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
};

export default CameraPermissionPopup;
