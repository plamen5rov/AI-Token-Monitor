"use client"

import * as React from "react"
import { BarChart3, Cpu, LayoutDashboard, Network, RefreshCw, Server, Settings } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { SyncAllButton } from "@/components/sync-button"

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Providers", href: "/providers", icon: Server },
  { label: "Models", href: "/models", icon: Cpu },
  { label: "Usage", href: "/usage", icon: BarChart3 },
  { label: "Gateway", href: "/gateway", icon: Network },
  { label: "Sync", href: "/sync", icon: RefreshCw },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <aside className="flex w-64 flex-col border-r border-border bg-card px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            A
          </div>
          <span className="text-lg font-semibold">ATM</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="text-base font-semibold">AI Token Monitor</h1>
          <div className="flex items-center gap-3">
            <SyncAllButton />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
