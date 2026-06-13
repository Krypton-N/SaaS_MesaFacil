import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
}

export function Input({
  label,
  icon,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="font-body text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant ml-1"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 text-secondary pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full min-h-[48px] bg-surface-container-low text-on-surface
            font-body text-base rounded-xl
            border-2 border-transparent outline-none
            focus:border-primary focus:bg-surface-container-lowest
            transition-all duration-200
            placeholder:text-secondary-fixed-dim
            shadow-sm
            ${icon ? 'pl-12 pr-4' : 'px-4'}
            ${error ? 'border-error focus:border-error' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <span className="text-error text-sm ml-1">{error}</span>
      )}
    </div>
  );
}
