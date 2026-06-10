import { forwardRef } from 'react';
import { cn } from '../shared/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('brutalist-card', className)} {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
