import React from 'react';
import { motion } from 'framer-motion';

export const GlassButton = ({ children, variant = 'primary', onClick, disabled, className = '', type = 'button' }) => {
  const baseClasses = "relative overflow-hidden w-full py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center outline-none select-none backdrop-blur-xl";
  
  const variants = {
    primary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 shadow-lg",
    neon: "bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-neon-blue)] text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] border border-white/20",
    secondary: "bg-transparent text-gray-400 hover:text-white"
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
