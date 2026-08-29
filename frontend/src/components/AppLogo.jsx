import React from 'react';
import { useTheme } from '../theme/ThemeProvider';

export function AppLogo({ className = 'w-9 h-9 rounded-xl', alt = 'EvalueFy.AI Logo' }) {
  const { theme } = useTheme();
  const iconSrc = theme === 'dark' ? '/icon1.png' : '/icon.png';

  return (
    <img
      src={iconSrc}
      alt={alt}
      className={`object-contain select-none transition-all duration-200 ${className}`}
    />
  );
}
