import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'white' | 'gradient' | 'orange' | 'glow';
  showText?: boolean;
  textClassName?: string;
  subtext?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'w-10 h-10',
  size,
  variant = 'gradient',
  showText = false,
  textClassName = 'text-xl',
  subtext
}) => {
  const sizeStyle = size ? { width: size, height: size } : undefined;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Bull and Bear Logo Mark (Exact Silhouette with Lightning Bolt) */}
      <div 
        style={sizeStyle} 
        className="relative shrink-0 flex items-center justify-center select-none"
      >
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full drop-shadow-md overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* High-end Neon Amber / Orange Trader Gradient */}
            <linearGradient id="traderLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFA028" />
              <stop offset="50%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#E63900" />
            </linearGradient>

            {/* Pure White with subtle gloss */}
            <linearGradient id="traderWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            {/* Glowing Bull (Green/Orange) vs Bear (Red/Orange) */}
            <linearGradient id="bullGrad" x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFAA33" />
              <stop offset="100%" stopColor="#FF6B00" />
            </linearGradient>

            <linearGradient id="bearGrad" x1="50%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#E63900" />
            </linearGradient>

            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="#FF6B00" floodOpacity="0.45" />
            </filter>
          </defs>

          <g filter={variant === 'glow' || variant === 'gradient' ? 'url(#logoGlow)' : undefined}>
            {/* BULL (LEFT SIDE - CHARGING UPWARD) */}
            <path
              d="M125 185 
                 C140 195, 175 198, 220 202 
                 C240 203, 235 240, 245 250 
                 C275 255, 345 270, 395 295 
                 C445 320, 485 360, 520 410 
                 L405 525 
                 L480 525 
                 L350 655 
                 C330 635, 305 600, 290 560 
                 L240 585 
                 L260 625 
                 L215 675 
                 L170 610 
                 L230 535 
                 C210 500, 185 460, 160 410 
                 C130 350, 95 315, 75 305 
                 L70 250 
                 C110 255, 145 250, 170 240 
                 C160 220, 140 200, 125 185 Z"
              fill={
                variant === 'white' 
                  ? 'url(#traderWhiteGrad)' 
                  : variant === 'orange' 
                  ? '#FF6B00' 
                  : 'url(#traderLogoGrad)'
              }
            />

            {/* LIGHTNING BOLT / SPLIT SLICE ACCENT */}
            <path
              d="M580 355 
                 L435 500 
                 L515 500 
                 L375 640 
                 L410 640 
                 L565 485 
                 L490 485 
                 L580 355 Z"
              fill="#FFFFFF"
              opacity="0.9"
            />

            {/* BEAR (RIGHT SIDE - STANDING / ROARING) */}
            <path
              d="M590 380 
                 L530 440 
                 C565 460, 600 485, 630 515 
                 L575 570 
                 L495 570 
                 L440 625 
                 C400 665, 360 700, 310 735 
                 L310 740 
                 L425 740 
                 C425 710, 440 680, 465 655 
                 C490 630, 520 620, 555 620 
                 C590 620, 620 630, 645 655 
                 C670 680, 685 710, 685 740 
                 L765 740 
                 L765 735 
                 C760 670, 780 610, 815 550 
                 C850 490, 885 450, 915 425 
                 L885 410 
                 C895 390, 905 375, 915 365 
                 L880 365 
                 C850 375, 810 385, 770 380 
                 C730 375, 670 385, 590 380 Z"
              fill={
                variant === 'white' 
                  ? 'url(#traderWhiteGrad)' 
                  : variant === 'orange' 
                  ? '#FF6B00' 
                  : 'url(#traderLogoGrad)'
              }
            />

            {/* DETAILED EMBEDDED HIGH ACCURACY PATH FOR BULL & BEAR SILHOUETTE */}
            {/* Bull Body Details */}
            <path
              d="M175 190 C165 210, 185 235, 235 245 C270 250, 320 265, 375 290 C440 320, 500 370, 575 420 L445 550 L530 550 L380 700 L320 740 L310 740 L310 710 C320 680, 350 630, 320 580 L230 600 L250 640 L195 700 L160 620 L210 540 C190 490, 150 430, 110 370 C80 320, 70 290, 70 270 C100 275, 140 270, 160 250 C150 230, 140 210, 120 185 C140 180, 160 185, 175 190 Z"
              fill="url(#traderLogoGrad)"
              opacity="0.95"
            />
            {/* Bear Body Details */}
            <path
              d="M580 395 C650 380, 720 370, 770 375 C820 380, 860 365, 885 355 C895 375, 880 395, 915 415 C875 445, 840 495, 810 555 C775 620, 765 675, 770 740 L690 740 C690 700, 670 660, 635 635 C605 615, 570 615, 545 630 C515 650, 495 690, 495 740 L425 740 C435 690, 465 640, 510 595 L460 595 L590 465 L525 465 L580 395 Z"
              fill="url(#traderLogoGrad)"
              opacity="0.95"
            />
            {/* Center Electric Bolt */}
            <polygon
              points="585,385 450,520 535,520 405,650 440,650 580,510 500,510"
              fill="#FFFFFF"
            />
          </g>
        </svg>
      </div>

      {/* Optional Brand Typography */}
      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 leading-none">
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
