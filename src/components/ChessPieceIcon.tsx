import React from 'react';
import { PieceType, PieceColor } from '../types/game';

interface IconProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
  glow?: boolean;
}

export const ChessPieceIcon: React.FC<IconProps> = ({ type, color, className = "w-12 h-12", glow = false }) => {
  const fillGradientId = `grad_${color}_${type}`;
  const strokeColor = color === 'w' ? '#38bdf8' : '#f43f5e'; // Cyan for White, Rose for Black
  const fillStart = color === 'w' ? '#0ea5e9' : '#e11d48';
  const fillEnd = color === 'w' ? '#0284c7' : '#be123c';
  
  // Custom glowing filter for premium authority look
  const filterId = `glow_${color}_${type}`;

  const renderSvgContent = () => {
    switch (type) {
      case 'p': // Pawn - Shield/Vanguard
        return (
          <>
            <path
              d="M24 6 L34 16 L34 30 Q24 40 14 30 L14 16 Z"
              fill={`url(#${fillGradientId})`}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="22" r="4" fill="#ffffff" opacity="0.8" />
            <path d="M18 16 H30" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
          </>
        );
      case 'n': // Knight - Jumpy/Fighting
        return (
          <>
            <path
              d="M14 38 C14 34 18 26 22 22 C20 18 16 16 16 10 C22 10 26 14 28 12 C32 10 30 6 34 8 C36 12 34 18 32 22 C32 26 34 30 32 38 Z"
              fill={`url(#${fillGradientId})`}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Lightning element for volt strike */}
            <path d="M22 28 L25 32 L22 34" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="26" cy="16" r="1.5" fill="#ffffff" />
          </>
        );
      case 'b': // Bishop - Mystic/Energy
        return (
          <>
            <path
              d="M24 6 C20 10 16 16 16 26 C16 32 20 36 24 38 C28 36 32 32 32 26 C32 16 28 10 24 6 Z"
              fill={`url(#${fillGradientId})`}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Inner mystical gem */}
            <path d="M24 14 L28 22 L24 30 L20 22 Z" fill="#ffffff" opacity="0.3" />
            <line x1="24" y1="18" x2="24" y2="26" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="21" y1="22" x2="27" y2="22" stroke="#ffffff" strokeWidth="1.5" />
          </>
        );
      case 'r': // Rook - Castle/Fortress
        return (
          <>
            <path
              d="M14 38 L14 16 L18 16 L18 10 H22 V14 H26 V10 H30 L30 16 L34 16 L34 38 Z"
              fill={`url(#${fillGradientId})`}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <rect x="20" y="24" width="8" height="8" rx="1" fill="#111827" opacity="0.6" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="14" y1="32" x2="34" y2="32" stroke={strokeColor} strokeWidth="1.5" />
          </>
        );
      case 'q': // Queen - Nebula/Shadow
        return (
          <>
            <path
              d="M24 38 C14 38 10 32 10 32 L14 14 L20 24 L24 8 L28 24 L34 14 L38 32 C38 32 34 38 24 38 Z"
              fill={`url(#${fillGradientId})`}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="8" r="2.5" fill="#ffffff" />
            <circle cx="14" cy="14" r="1.5" fill="#ffffff" />
            <circle cx="34" cy="14" r="1.5" fill="#ffffff" />
            <circle cx="24" cy="28" r="4" fill="#ffffff" opacity="0.25" />
          </>
        );
      case 'k': // King - Royal/Dragon
        return (
          <>
            <path
              d="M24 38 C14 38 12 34 12 34 L12 18 L18 22 L24 12 L30 22 L36 18 L36 34 C36 34 34 38 24 38 Z"
              fill={`url(#${fillGradientId})`}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Crown Cross */}
            <path d="M24 6 V12 M21 9 H27" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M18 28 H30" stroke="#ffffff" strokeWidth="2" opacity="0.3" />
            <circle cx="24" cy="28" r="3" fill="#ffffff" opacity="0.4" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 48 48"
      className={`${className} transition-transform duration-300 hover:scale-110`}
      style={{
        filter: glow ? `url(#${filterId})` : undefined,
      }}
    >
      <defs>
        <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fillStart} />
          <stop offset="100%" stopColor={fillEnd} />
        </linearGradient>

        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {renderSvgContent()}
    </svg>
  );
};
