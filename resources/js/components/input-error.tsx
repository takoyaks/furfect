import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            {...props}
            className={cn(
                'flex items-center gap-1.5 text-[13px] text-destructive animate-in fade-in-0 slide-in-from-top-1 duration-200',
                className
            )}
        >
            <AlertCircle className="size-3.5 shrink-0" />
            {message}
        </p>
    ) : null;
}
