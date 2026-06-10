import { forwardRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../shared/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, children, className, disabled, ...props }, ref) => {
    const variantClass =
      variant === 'primary'
        ? 'brutalist-btn'
        : variant === 'secondary'
        ? 'brutalist-btn-secondary'
        : 'brutalist-btn-danger';

    return (
      <button
        ref={ref}
        className={cn(variantClass, className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <RefreshCw size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
