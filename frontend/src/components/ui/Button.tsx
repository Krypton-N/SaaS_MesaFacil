import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: string;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-container text-on-primary rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110',
    secondary: 'bg-transparent border-2 border-inverse-surface text-inverse-surface rounded-xl hover:bg-surface-container-low',
    ghost: 'bg-transparent text-primary hover:bg-primary-fixed rounded-xl',
    danger: 'bg-error text-on-error rounded-xl hover:brightness-110',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-xl">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
