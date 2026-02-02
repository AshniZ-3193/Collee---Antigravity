import React from 'react';

interface ColleeLogoSvgProps {
  size?: number;
  className?: string;
}

const ColleeLogoSvg: React.FC<ColleeLogoSvgProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Paper Airplane - main body */}
      <g>
        {/* Left wing */}
        <path
          d="M5 70 L50 40 L50 60 Z"
          fill="#4F46E5"
          stroke="#E88A5A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Right wing / tail */}
        <path
          d="M50 40 L95 55 L50 60 Z"
          fill="#7C3AED"
          stroke="#E88A5A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Shadow/depth on airplane */}
        <path
          d="M50 40 L50 60"
          stroke="#5B21B6"
          strokeWidth="2"
        />
        {/* Inner fold accent */}
        <path
          d="M15 66 L50 50 L80 53"
          fill="none"
          stroke="#E88A5A"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>

      {/* Graduation Cap */}
      <g>
        {/* Cap board outline */}
        <path
          d="M55 8 L92 22 L55 36 L18 22 Z"
          fill="none"
          stroke="#5B21B6"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Cap board inner/top */}
        <path
          d="M55 12 L85 24 L55 34 L25 24 Z"
          fill="white"
          stroke="#5B21B6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Cap button */}
        <circle cx="55" cy="23" r="2.5" fill="#E88A5A" />
        
        {/* Tassel cord */}
        <path
          d="M55 23 C60 20, 68 22, 72 30 C76 38, 74 45, 72 52"
          fill="none"
          stroke="#E88A5A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Tassel knot */}
        <ellipse cx="72" cy="52" rx="4" ry="3" fill="#E88A5A" />
        
        {/* Tassel fringe */}
        <path
          d="M68 55 L68 68"
          stroke="#E88A5A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M72 55 L72 70"
          stroke="#E88A5A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M76 55 L76 68"
          stroke="#E88A5A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default ColleeLogoSvg;
