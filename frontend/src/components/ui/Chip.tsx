import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  icon?: string;
  className?: string;
}

export function Chip({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  className = '',
}: ChipProps) {
  const variants = {
    default: 'bg-surface-container text-on-surface-variant',
    primary: 'bg-primary-fixed text-primary',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    error: 'bg-error-container text-on-error-container',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-bold tracking-wider uppercase
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
      {children}
    </span>
  );
}
