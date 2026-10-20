import { ButtonHTMLAttributes, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
}

export default function PrimaryButton({ 
  children, 
  isLoading = false,
  loadingLabel = 'A calcular...',
  className = '', 
  disabled,
  ...props 
}: PrimaryButtonProps) {
  return (
    <button
      className={`bg-verde text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 hover:bg-verde-med active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      style={{ backgroundColor: disabled || isLoading ? undefined : '#1B5E3B' }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
