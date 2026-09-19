import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent shadow-sm transition-all duration-200 ease-in-out outline-none",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
        "data-[size=default]:h-[22px] data-[size=default]:w-[40px]",
        "data-[size=sm]:h-[16px] data-[size=sm]:w-[28px]",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        "data-checked:bg-primary data-checked:shadow-primary/25",
        "data-unchecked:bg-input dark:data-unchecked:bg-input/80",
        "hover:data-unchecked:bg-input/80 dark:hover:data-unchecked:bg-input",
        "hover:data-checked:bg-primary/90",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-all duration-200 ease-in-out",
          "group-data-[size=default]/switch:size-[18px]",
          "group-data-[size=sm]/switch:size-[12px]",
          "group-data-[size=default]/switch:data-checked:translate-x-[calc(100%+0px)]",
          "group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%+0px)]",
          "dark:data-checked:bg-primary-foreground",
          "group-data-[size=default]/switch:data-unchecked:translate-x-[1px]",
          "group-data-[size=sm]/switch:data-unchecked:translate-x-[1px]",
          "dark:data-unchecked:bg-foreground",
          "data-checked:shadow-md"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
