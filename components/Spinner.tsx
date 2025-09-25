import React from 'react';
import { cn } from '../lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-b-2',
    md: 'h-12 w-12 border-b-2',
    lg: 'h-16 w-16 border-b-4',
  };

  return (
    <div className={cn("animate-spin rounded-full border-primary", sizeClasses[size], className)}></div>
  );
};

export default Spinner;