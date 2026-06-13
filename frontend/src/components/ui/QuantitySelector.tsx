import React from 'react';

interface QuantitySelectorProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  className = '',
}: QuantitySelectorProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value < max) {
      onChange(value + 1);
    }
  };

  const btnStyles = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const textStyles = size === 'sm' ? 'text-sm w-6' : 'text-base w-8';

  return (
    <div className={`inline-flex items-center bg-surface-container-low rounded-xl p-1 shadow-sm ${className}`}>
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className={`
          ${btnStyles} flex items-center justify-center rounded-lg text-on-surface
          hover:bg-surface-container-high active:scale-90 transition-all duration-150
          disabled:opacity-30 disabled:pointer-events-none
        `}
      >
        <span className="material-symbols-outlined text-lg font-bold">remove</span>
      </button>
      <span className={`${textStyles} font-bold text-center text-on-surface`}>{value}</span>
      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className={`
          ${btnStyles} flex items-center justify-center rounded-lg text-on-surface
          hover:bg-surface-container-high active:scale-90 transition-all duration-150
          disabled:opacity-30 disabled:pointer-events-none
        `}
      >
        <span className="material-symbols-outlined text-lg font-bold">add</span>
      </button>
    </div>
  );
}
