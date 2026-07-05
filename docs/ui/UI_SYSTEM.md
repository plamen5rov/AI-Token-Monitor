# UI_SYSTEM.md

## AI Token Monitor (ATM) — Design System

This document defines the visual language, layout principles, and theme system
for ATM.

The goal is to create a **modern, elegant, developer-grade dashboard** with a
strong dark-first identity and optional light mode.

---

## Core Design Philosophy

ATM should feel like:

* a modern observability tool (Grafana / Vercel / Linear)
* not a finance app
* not a spreadsheet
* not a crypto tracker

Design goals:

1. Clarity over decoration
2. Density without clutter
3. Soft contrast, not harsh borders
4. Calm, professional aesthetic
5. Fast visual scanning

---

## Theme Strategy

## Default Theme: Dark Mode

Dark mode is the primary and default experience.

Characteristics:

* deep neutral backgrounds
* subtle elevation layers
* soft borders
* minimal glow accents

### Base palette (dark)

```text id="dark-palette"
background: #0B0F17
surface:    #111827
card:       #151C2C
border:     #243042

text-primary:   #E5E7EB
text-secondary: #9CA3AF
text-muted:     #6B7280

accent:     #60A5FA
success:    #34D399
warning:    #FBBF24
error:      #F87171
```

---

## Secondary Theme: Light Mode

Light mode exists only for preference, not branding.

Characteristics:

* soft gray backgrounds
* reduced contrast fatigue
* same layout, no structural changes

### Base palette (light)

```text id="light-palette"
background: #F9FAFB
surface:    #FFFFFF
card:       #F3F4F6
border:     #E5E7EB

text-primary:   #111827
text-secondary: #4B5563
text-muted:     #6B7280

accent:     #3B82F6
success:    #10B981
warning:    #F59E0B
error:      #EF4444
```

---

## Theme Rules

* Dark mode is default on first load
* Light mode is opt-in
* No automatic system switching required
* Theme toggle must persist in settings

---

## Layout System

## Layout Principle: “Dashboard Grid Clarity”

ATM uses a structured grid layout:

```text id="layout"
[ Sidebar ] [ Main Content Area ]
```

---

## Sidebar

Fixed width navigation:

* Overview
* Providers
* Models
* Usage
* Settings

Design:

* minimal icons + labels
* subtle hover states
* no heavy borders

---

## Main Content

Uses card-based layout:

* metrics at top
* charts in middle
* tables at bottom

---

## Components

## Cards

Core UI building block.

Rules:

* soft background contrast
* subtle border only
* no heavy shadows
* hover = slight elevation

---

## Metrics Tiles

Used for:

* total cost
* token usage
* active providers
* requests

Style:

* large number
* small label
* optional delta indicator

---

## Charts

Rules:

* minimal grid lines
* muted axis labels
* accent-only data lines
* no decorative chart clutter

---

## Tables

Design principles:

* dense but readable
* zebra striping optional
* hover row highlight only
* no heavy borders

---

## Typography

## Font system

Use system font stack or modern UI font:

Preferred:

* Inter
* or system-ui fallback

---

## Hierarchy

| Level | Usage           |
| ----- | --------------- |
| H1    | Page titles     |
| H2    | Section headers |
| H3    | Subsections     |
| Body  | default text    |
| Small | metadata        |

---

## Spacing System

Strict spacing scale:

```text id="spacing"
4px, 8px, 12px, 16px, 24px, 32px, 48px
```

No arbitrary spacing values.

---

## Borders & Radius

* Border radius: 8px default
* Cards: 10–12px
* Buttons: 6–8px

Borders are subtle, never dominant.

---

## Interaction Design

## Hover behavior

* slight background lift
* no large animations
* no bouncing effects

## Transitions

* 150–200ms max
* ease-out only

---

## Accent Color

Single accent system:

* primary blue (default)
* used for:

  * active navigation
  * charts
  * primary buttons
  * highlights

No multi-accent chaos.

---

## Data Density Rule

ATM is a **high-information dashboard**, but:

* never overwhelm with visual noise
* group related metrics
* prefer tabs over clutter
* collapse secondary info

---

## Dark Mode Aesthetic Reference

Inspired by:

* Vercel Dashboard
* Linear
* OpenAI usage dashboard
* Grafana (modern themes)

---

## Light Mode Aesthetic Reference

Inspired by:

* Notion light theme
* Stripe dashboard
* Apple system UI

---

## Accessibility Rules

* minimum contrast AA compliance
* no color-only meaning
* always include labels with icons or values

---

## Guiding Principle

ATM should feel:

> calm, precise, and engineered — not flashy

Users should feel they are observing a system, not interacting with a website.
