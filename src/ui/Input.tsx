import { forwardRef } from 'react';
import { cn } from '../shared/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input ref={ref} className={cn('brutalist-input', className)} {...props} />;
});

Input.displayName = 'Input';

export default Input;
