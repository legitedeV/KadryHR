import { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  side?: 'left' | 'right';
}

export function Drawer({ open, onOpenChange, children, title, side = 'right' }: DrawerProps) {
  const slideFrom = side === 'right' ? 'translate-x-full' : '-translate-x-full';
  const slidePosition = side === 'right' ? 'right-0' : 'left-0';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed top-0 z-50 h-full w-full max-w-md bg-white shadow-lg transition-transform duration-300',
            slidePosition,
            open ? 'translate-x-0' : slideFrom
          )}
        >
          <div className="flex h-full flex-col">
            {title && (
              <div className="flex items-center justify-between border-b border-secondary-200 p-4">
                <Dialog.Title className="text-lg font-semibold">
                  {title}
                </Dialog.Title>
                <Dialog.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Zamknij</span>
                </Dialog.Close>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
