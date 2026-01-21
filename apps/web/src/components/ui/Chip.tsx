import { HTMLAttributes } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  onRemove?: () => void;
  variant?: 'default' | 'primary';
}

export function Chip({ className, onRemove, variant = 'default', children, ...props }: ChipProps) {
  const variants = {
    default: 'bg-secondary-100 text-secondary-700',
    primary: 'bg-primary-100 text-primary-700',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="rounded-full hover:bg-black/10 p-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
