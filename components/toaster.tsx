"use client"

import { Toaster as SonnerToaster } from "sonner"
import { useTheme } from "next-themes"

export function Toaster() {
  const { theme } = useTheme()
  return (
    <SonnerToaster
      theme={(theme as "light" | "dark") || "dark"}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group/[sonner-toaster]:bg-card group/[sonner-toaster]:text-card-foreground group/[sonner-toaster]:border-border group/[sonner-toaster]:rounded-lg",
          description: "group/[sonner-toast]:text-muted-foreground",
        },
      }}
    />
  )
}