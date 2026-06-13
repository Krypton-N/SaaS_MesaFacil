import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  padded?: boolean;
}

export function Card({
  children,
  hoverable = true,
  padded = true,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container
        transition-all duration-300
        ${hoverable ? 'hover:-translate-y-1 hover:shadow-lifted cursor-pointer' : ''}
        ${padded ? 'p-5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
