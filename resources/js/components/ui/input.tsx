import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

type InputSize = "sm" | "default" | "lg"

interface InputProps extends React.ComponentProps<"input"> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputSize?: InputSize
}

const sizeClasses: Record<InputSize, string> = {
  sm: "h-8 text-xs px-2.5",
  default: "h-10 text-sm px-3",
  lg: "h-12 text-base px-4",
}

function Input({
  className,
  type,
  leftIcon,
  rightIcon,
  inputSize = "default",
  ...props
}: InputProps) {
  if (leftIcon || rightIcon) {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/70">
            {leftIcon}
          </span>
        )}
        <InputPrimitive
          type={type}
          data-slot="input"
          className={cn(
            "w-full min-w-0 rounded-lg border border-input bg-transparent transition-all duration-200 outline-none",
            "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground/60",
            "hover:border-ring/50",
            "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
            "dark:bg-input/30 dark:hover:bg-input/40 dark:disabled:bg-input/80",
            "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
            sizeClasses[inputSize],
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/70">
            {rightIcon}
          </span>
        )}
      </div>
    )
  }

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-lg border border-input bg-transparent transition-all duration-200 outline-none",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground/60",
        "hover:border-ring/50",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
        "dark:bg-input/30 dark:hover:bg-input/40 dark:disabled:bg-input/80",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        sizeClasses[inputSize],
        className
      )}
      {...props}
    />
  )
}

export { Input }
export type { InputProps }
