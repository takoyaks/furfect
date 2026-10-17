"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ),
        info: (
          <InfoIcon className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
        ),
        error: (
          <OctagonXIcon className="size-5 text-red-600 dark:text-red-400 shrink-0" />
        ),
        loading: (
          <Loader2Icon className="size-5 animate-spin text-gray-500 shrink-0" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-neutral-900 group-[.toaster]:text-gray-900 dark:group-[.toaster]:text-neutral-100 group-[.toaster]:border-2 group-[.toaster]:border-amber-400 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:px-5 group-[.toaster]:py-3.5 group-[.toaster]:font-semibold group-[.toaster]:text-sm group-[.toaster]:min-w-[320px] group-[.toaster]:max-w-xl group-[.toaster]:w-auto group-[.toaster]:flex group-[.toaster]:items-center group-[.toaster]:gap-3 group-[.toaster]:backdrop-blur-md group-[.toaster]:mt-3",
          description: "group-[.toast]:text-gray-500 dark:group-[.toast]:text-neutral-400",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-emerald-500 group-[.toaster]:bg-emerald-50/95 dark:group-[.toaster]:bg-emerald-950/90 group-[.toaster]:text-emerald-950 dark:group-[.toaster]:text-emerald-100",
          error:
            "group-[.toaster]:border-red-500 group-[.toaster]:bg-red-50/95 dark:group-[.toaster]:bg-red-950/90 group-[.toaster]:text-red-950 dark:group-[.toaster]:text-red-100",
          warning:
            "group-[.toaster]:border-amber-500 group-[.toaster]:bg-amber-50/95 dark:group-[.toaster]:bg-amber-950/90 group-[.toaster]:text-amber-950 dark:group-[.toaster]:text-amber-100",
          info:
            "group-[.toaster]:border-blue-500 group-[.toaster]:bg-blue-50/95 dark:group-[.toaster]:bg-blue-950/90 group-[.toaster]:text-blue-950 dark:group-[.toaster]:text-blue-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
