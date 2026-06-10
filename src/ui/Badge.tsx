import { forwardRef } from 'react';
import { cn } from '../shared/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  default: 'bg-brand-dark text-white',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'font-mono text-[9px] px-1.5 py-0.5 rounded-none uppercase',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
