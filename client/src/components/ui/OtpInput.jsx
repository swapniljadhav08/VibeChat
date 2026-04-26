import React, { useRef } from 'react';

export const OtpInput = ({ length = 6, value, onChange }) => {
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (isNaN(val)) return;
    
    const newOtp = value.split('');
    // Handle paste or multi-char by just taking the last char
    newOtp[index] = val.substring(val.length - 1);
    const combined = newOtp.join('');
    onChange(combined);

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center w-full mb-8 mt-4">
      {Array(length).fill(0).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-2xl text-white focus:border-[var(--color-neon-purple)] focus:shadow-[0_0_20px_rgba(139,92,246,0.3)] focus:bg-white/10 outline-none transition-all backdrop-blur-xl"
        />
      ))}
    </div>
  );
};
