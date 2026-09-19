import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    'flex min-h-[100px] w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm leading-relaxed transition-all duration-200 outline-none',
                    'placeholder:text-muted-foreground/60',
                    'hover:border-ring/50',
                    'focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20',
                    'disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50',
                    'aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20',
                    'dark:bg-input/30 dark:hover:bg-input/40',
                    'dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = 'Textarea';

export { Textarea };
