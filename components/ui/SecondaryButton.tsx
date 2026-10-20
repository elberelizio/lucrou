import { ButtonHTMLAttributes, ReactNode } from 'react';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function SecondaryButton({ 
  children, 
  className = '', 
  ...props 
}: SecondaryButtonProps) {
  return (
    <button
      className={`
        bg-white text-verde border-2 border-verde font-medium py-4 px-6 rounded-2xl
        transition-all duration-200
        hover:bg-mint active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
