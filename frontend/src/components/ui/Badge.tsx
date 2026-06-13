import React from 'react';

interface BadgeProps {
  content: string | number;
  variant?: 'primary' | 'secondary' | 'error' | 'success';
  className?: string;
}

export function Badge({
  content,
  variant = 'primary',
  className = '',
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary-container text-on-primary',
    secondary: 'bg-secondary-container text-on-secondary-container',
    error: 'bg-error text-on-error',
    success: 'bg-success text-white',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-xs font-bold rounded-full
        animate-scale-in shadow-sm
        ${variants[variant]}
        ${className}
      `}
    >
      {content}
    </span>
  );
}
