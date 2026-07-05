# MVP_ROADMAP_7_StageS.md

# AI Token Monitor (ATM) — 7-Stage MVP Roadmap

This document defines the implementation roadmap for the first working version of AI Token Monitor (ATM).

The roadmap is organized into **Stages**, not time estimates. Complete each Stage before moving to the next.

The objective is to build a clean, maintainable MVP that can be extended without major architectural changes.

---

# Stage 1 — Project Foundation

## Goals

* Initialize the Next.js project (App Router)
* Configure TypeScript
* Install Tailwind CSS
* Install shadcn/ui
* Install better-sqlite3
* Configure project structure
* Configure linting and formatting
* Create the base application layout

## Deliverables

* Application runs locally
* Sidebar and top navigation shell
* Dark theme enabled by default
* Light theme toggle available
* Initial folder structure in place

**Exit Criteria**

* Project builds successfully
* No TypeScript errors
* Basic layout renders correctly

---

# Stage 2 — Database Layer

## Goals

* Implement the SQLite connection layer
* Create the database module
* Implement the schema defined in `DATABASE_SCHEMA.md`
* Create a migration system using raw SQL
* Create reusable database helper functions

## Deliverables

* Database initializes automatically
* CRUD operations for providers
* CRUD operations for models
* CRUD operations for usage records
* Migration system operational

**Exit Criteria**

* Database is created automatically
* Tables are populated successfully
* CRUD operations are verified

---

# Stage 3 — Provider Integration Framework

## Goals

* Implement the BaseProvider interface
* Build the provider adapter system
* Implement normalization utilities
* Integrate the first provider (OpenAI)
* Store normalized usage data in SQLite

## Deliverables

* Provider abstraction complete
* OpenAI adapter functional
* Usage synchronization working
* Cost normalization implemented

**Exit Criteria**

* Usage data is fetched successfully
* Normalized records are stored correctly
* Data matches provider output

---

# Stage 4 — Synchronization Engine

## Goals

* Implement the synchronization service
* Add manual "Sync Now" functionality
* Implement sync history logging
* Handle provider failures gracefully
* Prevent duplicate usage records

## Synchronization Flow

```text
User initiates sync
        ↓
Provider adapter fetches data
        ↓
Normalize provider response
        ↓
Calculate costs (if required)
        ↓
Store in SQLite
        ↓
Update aggregates
        ↓
Write sync log
```

## Deliverables

* Reliable synchronization pipeline
* Sync history page
* Error handling
* Duplicate protection

**Exit Criteria**

* Sync completes successfully
* Errors are logged correctly
* Database remains consistent

---

# Stage 5 — Dashboard & Analytics

## Goals

Build the first usable dashboard.

### Overview

* Total spending
* Token usage
* Active providers
* Requests

### Charts

* Daily cost
* Monthly cost
* Token usage trends

### Tables

* Provider breakdown
* Model breakdown
* Recent activity

## Deliverables

* Fully functional analytics dashboard
* Responsive layout
* Fast chart rendering

**Exit Criteria**

* Dashboard displays live data
* Charts update correctly
* Navigation is complete

---

# Stage 6 — Multi-Provider Support

## Goals

Expand ATM beyond a single provider.

### Add support for

* Anthropic
* OpenRouter

Implement:

* Provider management
* API key management
* Enable/disable providers
* Provider health checks

## Deliverables

* Multiple providers configured simultaneously
* Unified analytics across providers
* Provider status monitoring

**Exit Criteria**

* Multiple providers synchronize correctly
* Dashboard aggregates data consistently
* Provider switching works as expected

---

# Stage 7 — MVP Polish & Release Readiness

## Goals

Prepare ATM for public release.

### Polish

* Empty states
* Loading skeletons
* Toast notifications
* Error pages
* Theme persistence
* Accessibility improvements
* Performance optimization

### Documentation

* Update README
* Verify AGENTS.md
* Review architecture
* Verify migrations
* Add screenshots (optional)

### Testing

* Verify clean installation
* Test fresh database creation
* Test provider onboarding
* Test synchronization
* Test theme switching

## Deliverables

* Stable MVP
* Complete documentation
* Release-ready repository

**Exit Criteria**

The MVP is considered complete when:

* At least two providers are fully integrated
* Synchronization is reliable
* Dashboard displays accurate usage and cost information
* API keys can be configured through the UI
* Data persists correctly in SQLite
* Documentation is complete
* The project can be cloned and started by another developer without additional setup

---

# Post-MVP (Not Part of This Roadmap)

The following features are intentionally deferred:

* Forecasting and spend prediction
* Anomaly detection
* Latency benchmarking
* Pricing history
* Usage alerts
* Budget limits
* Multi-project support
* Team and multi-user support
* Plugin ecosystem
* Export/import functionality

---

# Guiding Principles

During every Stage:

* Prefer simplicity over abstraction.
* Keep components small and composable.
* Normalize all provider data before storage.
* Avoid premature optimization.
* Maintain a clear separation between UI, business logic, providers, and database layers.
* Build one complete feature at a time before moving to the next Stage.
