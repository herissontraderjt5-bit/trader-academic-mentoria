import React from 'react';
import logoImg from '../assets/logo.png';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'white' | 'gradient' | 'orange' | 'glow';
  showText?: boolean;
  textClassName?: string;
  subtext?: string;
  layout?: 'row' | 'col';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-10 w-auto',
  size,
  showText = false,
  textClassName = 'text-xl',
  subtext,
  layout = 'row'
}) => {
  const sizeStyle = size 
    ? { height: typeof size === 'number' ? `${size}px` : size } 
    : undefined;

  const isCol = layout === 'col';

  return (
    <div className={`inline-flex ${isCol ? 'flex-col items-center justify-center text-center gap-2' : 'items-center gap-3'} ${className}`}>
      <img
        src={logoImg}
        alt="Academic Trader Logo"
        style={sizeStyle}
        className={`${size ? '' : 'h-10'} w-auto object-contain select-none transition-transform group-hover:scale-105`}
      />
      {showText && (
        <div className={`flex flex-col select-none ${isCol ? 'items-center text-center' : ''}`}>
          <div className="flex items-center gap-1.5 leading-none justify-center">
            <span className={`font-black tracking-tight text-orange-500 uppercase font-sans ${textClassName}`}>
              TRADER
            </span>
            <span className={`font-black tracking-tight text-white uppercase font-sans ${textClassName}`}>
              ACADEMIC
            </span>
          </div>
          {subtext && (
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase mt-1">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

