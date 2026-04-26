import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

export const GlassInput = ({ label, type = 'text', value, onChange, placeholder, required, icon: Icon }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative mb-6 w-full">
      <motion.label 
        initial={false}
        animate={{ 
          y: isFocused || value ? -26 : 0,
          scale: isFocused || value ? 0.85 : 1,
          color: isFocused ? 'var(--color-neon-purple)' : '#94A3B8'
        }}
        className="absolute left-4 top-3.5 origin-left pointer-events-none text-gray-400 z-10 font-medium transition-colors"
      >
        {label}
      </motion.label>
      
      <div className={`relative flex items-center w-full rounded-2xl border transition-all duration-300 ${isFocused ? 'border-[var(--color-neon-purple)] shadow-[0_0_15px_rgba(139,92,246,0.15)] bg-white/10' : 'border-white/10 bg-white/5'} backdrop-blur-xl`}>
        {Icon && (
           <div className="pl-4 text-gray-400 z-10">
             <Icon size={18} />
           </div>
        )}
        <input
          type={inputType}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full px-4 py-3.5 bg-transparent outline-none text-white placeholder-transparent z-10 ${Icon ? 'pl-3' : ''}`}
          placeholder={placeholder}
        />
        
        {type === 'password' && (
          <button 
            type="button"
            className="pr-4 text-gray-400 hover:text-white z-10 transition-colors cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};
