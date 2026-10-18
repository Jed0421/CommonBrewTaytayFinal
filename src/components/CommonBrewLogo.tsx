import React from 'react';

interface CommonBrewLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  height?: number | string;
  color?: string;
  className?: string;
}

export const CommonBrewLogo: React.FC<CommonBrewLogoProps> = ({
  variant = 'full',
  size = 'md',
  height,
  color = '#FF5E00',
  className = '',
}) => {
  // Height presets
  const sizeHeights = {
    sm: 22,
    md: 30,
    lg: 40,
    xl: 52,
  };

  const actualHeight = height || sizeHeights[size];

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ height: actualHeight, cursor: 'pointer' }}
    >
      <span
        style={{
          color: color,
          fontWeight: 900,
          fontSize: `${typeof actualHeight === 'number' ? actualHeight * 0.72 : 22}px`,
          letterSpacing: '0.06em',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        COMMONBREW
      </span>
    </div>
  );
};
