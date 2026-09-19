"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Circle } from "lucide-react"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

function RadioGroup({
  className,
  value,
  onValueChange,
  disabled,
  children,
  ...props
}: RadioGroupProps) {
  return (
    <div
      data-slot="radio-group"
      role="radiogroup"
      data-disabled={disabled || undefined}
      className={cn("flex gap-3", className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement<RadioGroupItemProps>(child)) {
          return React.cloneElement(child, {
            checked: child.props.value === value,
            onSelect: () => onValueChange?.(child.props.value),
            disabled: disabled || child.props.disabled,
          })
        }
        return child
      })}
    </div>
  )
}

interface RadioGroupItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string
  checked?: boolean
  onSelect?: () => void
  disabled?: boolean
}

function RadioGroupItem({
  className,
  value,
  checked,
  onSelect,
  disabled,
  children,
  ...props
}: RadioGroupItemProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-slot="radio-group-item"
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2.5 text-sm outline-none transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "relative flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] shadow-sm transition-all duration-200",
          checked
            ? "border-primary bg-primary text-primary-foreground shadow-primary/25"
            : "border-input hover:border-primary/50 hover:bg-primary/5 dark:bg-input/30"
        )}
      >
        {checked && (
          <Circle className="size-2 fill-current animate-in zoom-in-75 duration-150" />
        )}
      </span>
      {children}
    </button>
  )
}

export { RadioGroup, RadioGroupItem }
