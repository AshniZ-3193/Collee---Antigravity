import React from 'react';
import ColleeLogoSvg from './ColleeLogoSvg';

interface ColleeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
  onClick?: () => void;
  className?: string;
}

const ColleeLogo: React.FC<ColleeLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  onClick,
  className = '',
}) => {
  const sizeClasses = {
    xs: {
      iconSize: 28,
      text: 'text-lg font-bold',
      tagline: 'text-[9px] tracking-[0.02em]',
    },
    sm: {
      iconSize: 40,
      text: 'text-2xl font-bold',
      tagline: 'text-[11px] tracking-[0.03em]',
    },
    md: {
      iconSize: 52,
      text: 'text-3xl font-bold',
      tagline: 'text-sm tracking-[0.02em]',
    },
    lg: {
      iconSize: 64,
      text: 'text-4xl font-bold',
      tagline: 'text-base tracking-[0.02em]',
    },
  };

  const config = sizeClasses[size];

  const content = (
    <div className="flex items-center gap-1">
      <ColleeLogoSvg size={config.iconSize} className="flex-shrink-0" />
      
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={config.text} style={{ color: '#5B21B6' }}>Collee</span>
          {showTagline && (
            <span className={`${config.tagline} font-normal`} style={{ color: '#E88A5A' }}>
              Admissions Copilot
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`hover:opacity-80 transition-opacity ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
};

export default ColleeLogo;
