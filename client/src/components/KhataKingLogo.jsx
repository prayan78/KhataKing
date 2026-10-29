import React from 'react';

export default function KhataKingLogo({ size = 48, className = '', showText = false, textClassName = '' }) {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div 
        style={{ width: size, height: size }}
        className="relative flex-shrink-0 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-gradient-to-br from-[#054c3a] via-[#023c2e] to-[#01261d] border border-emerald-700/50"
      >
        <img 
          src="/icon-192.png" 
          alt="KhataKing Logo" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to SVG if PNG fails
            e.currentTarget.src = '/khataking-icon.svg';
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <span className={`font-black tracking-tight leading-none text-emerald-900 ${textClassName || 'text-2xl'}`}>
            Khata<span className="text-[#b8861b]">King</span>
          </span>
          <span className="text-xs font-semibold text-emerald-700 tracking-wide mt-0.5">
            नेपालको किराना खाता
          </span>
        </div>
      )}
    </div>
  );
}

