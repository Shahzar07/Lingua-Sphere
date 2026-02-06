
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`glass rounded-xl p-8 transition-all duration-500 ${className} ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}`}
    >
      {children}
    </div>
  );
};
