# UI_IMPLEMENTATION_PLAN.md

## AI Token Monitor (ATM) — shadcn/ui Implementation Plan

This document defines the exact component structure and build order for
implementing the ATM dashboard UI using shadcn/ui.

The goal is to create a **modern, elegant, data-dense observability dashboard**.

---

## Core UI Architecture

ATM UI is structured into 3 layers:

```text id="ui-layers"
Layout Layer → Page Layer → Component Layer
```

---

## 1. Layout System (Foundation)

## 1.1 App Shell

### Components used

* `Sidebar`
* `Topbar`
* `MainContent`

### Structure

```text id="app-shell"
[Sidebar] [Main Content Area]
```

### Responsibilities

Sidebar:

* navigation
* provider status indicators
* theme toggle

Topbar:

* page title
* sync button
* global search (future)

---

## 1.2 Sidebar (shadcn/ui + custom)

### Components

* `Button`
* `Separator`
* `Tooltip`
* `Avatar` (optional for future multi-user)

### Sections

* Overview
* Providers
* Models
* Usage
* Settings

### State

* active route highlight
* collapsed mode (optional later)

---

## 2. Core Dashboard Components

## 2.1 Metric Cards (Overview KPIs)

### shadcn components

* `Card`
* `CardHeader`
* `CardContent`

### Metrics displayed

* Total Cost (USD)
* Tokens Used
* Active Providers
* Requests Today

### Layout

```text id="metrics-grid"
[ Card ] [ Card ] [ Card ] [ Card ]
```

### Behavior

* number animation optional
* delta indicator (↑ ↓ % change)

---

## 2.2 Provider Status Cards

### Components (2)

* `Card`
* `Badge`
* `Progress`

### Shows

For each provider:

* name
* API status (healthy / error)
* last sync time
* usage summary

---

## 2.3 Usage Chart Panel

### Components (3)

* `Card`
* `Tabs`
* `Select`
* `Chart (Recharts wrapper)`

### Tabs

* Daily usage
* Monthly usage
* Cost trend
* Token trend

### Controls

* provider filter
* date range selector

---

## 2.4 Model Breakdown Table

### Components (4)

* `Table`
* `Badge`
* `DropdownMenu`
* `Input` (search filter)

### Columns

* Model name
* Provider
* Input tokens
* Output tokens
* Total cost
* Avg cost per request

### Features

* sortable columns
* searchable models
* filter by provider

---

## 3. Provider Management UI

## 3.1 Provider List Page

### Components (5)

* `Card`
* `Switch`
* `Button`
* `Dialog`

### Each provider card includes

* provider name
* API key status
* enable/disable toggle
* sync button
* last sync time

---

## 3.2 Add Provider Dialog

### Components (6)

* `Dialog`
* `Select`
* `Input`
* `Button`

### Flow

1. Select provider type
2. Enter API key
3. Save encrypted key
4. Test connection

---

## 4. Sync System UI

## 4.1 Sync Button (Global Action)

### Components (7)

* `Button`
* `Loader`

### Behavior (2)

* triggers provider sync
* shows loading state
* success/failure toast

---

## 4.2 Sync Log Panel

### Components (8)

* `Table`
* `Badge`

### Fields

* provider
* status
* timestamp
* error message

---

## 5. Settings Page

## Components (9)

* `Card`
* `Switch`
* `Select`
* `Input`

### Settings

* theme toggle (dark/light)
* currency selection
* sync interval
* default dashboard view

---

## 6. Supporting UI Components (Reusable)

## 6.1 Loading States

### Components (10)

* `Skeleton`

Used for:

* dashboard loading
* chart loading
* table loading

---

## 6.2 Empty States

### Components (11)

* `Card`
* icon (Lucide)
* text message
* action button

Used when:

* no providers configured
* no usage data yet

---

## 6.3 Toast Notifications

### Component

* `Toast`
* `useToast`

Events:

* sync success
* sync error
* API key saved
* provider added

---

## 6.4 Theme Toggle

### Components (12)

* `DropdownMenu`
* `Switch`

Behavior:

* toggle dark/light mode
* persist in settings table

---

## 7. Data Visualization Layer

## Chart Wrapper Component

### File

```text id="chart-wrapper"
/components/charts/UsageChart.tsx
```

### Uses

* Recharts
* theme-aware colors

### Charts

* Line chart (cost over time)
* Bar chart (provider comparison)
* Area chart (token usage)

---

## 8. Component Hierarchy

```text id="component-tree"
App
 ├── Layout
 │    ├── Sidebar
 │    ├── Topbar
 │    └── MainContent
 │
 ├── Dashboard
 │    ├── MetricCards
 │    ├── ProviderCards
 │    ├── UsageCharts
 │    └── ModelTable
 │
 ├── Providers
 │    ├── ProviderList
 │    └── AddProviderDialog
 │
 ├── Settings
 │    └── SettingsForm
 │
 └── Shared
      ├── Toasts
      ├── Skeletons
      ├── EmptyStates
      └── ThemeToggle
```

---

## 9. Component Design Rules

## DO

* reuse shadcn components
* keep components small (<250–300 lines)
* use composition over inheritance
* keep logic outside UI when possible

---

## DON'T

* build custom UI libraries
* duplicate Card/Table logic
* mix API logic in components
* over-abstract early

---

## 10. UI Performance Rules

* prefer server components for data-heavy views
* avoid client-side fetching for tables
* cache aggregated queries
* lazy load charts

---

## 11. Theme Integration Rule

All components MUST support:

* dark mode (default)
* light mode (optional)

No component may hardcode colors.

---

## 12. Build Order (IMPORTANT)

Implement in this order:

1. Layout (Sidebar + App Shell)
2. Metric Cards
3. Provider Cards
4. Sync System UI
5. Usage Charts
6. Model Table
7. Provider Management
8. Settings Page
9. Polish (toasts, skeletons, empty states)

---

## Guiding Principle

UI is not decoration.

It is a **data visualization layer for system telemetry**.

Every component must answer:

> “What is the state of my AI usage system right now?”
