# DONE.md

Changelog for the AI Token Monitor (ATM) project.

---

## Phase 0 — Project Documentation

- [2026-07-05] Reorganized project documentation: moved spec files into `docs/agents/`, `docs/architecture/`, and `docs/ui/`; added Documentation Structure section to `AGENTS.md`; fixed internal cross-references in agent docs (files modified: AGENTS.md, docs/agents/*, docs/architecture/*, docs/ui/*)
- [2026-07-05] Added Agent Workflow Rules to `AGENTS.md` and agent instruction docs: detect inconsistencies and ask user, keep docs in sync with decisions, log all changes in `DONE.md` (files modified: AGENTS.md, docs/agents/OPENODE_MASTER_PROMPT.md, docs/agents/OPENODE_BUILD_AGENT.md, DONE.md)

---

## Phase 1 — Project Foundation

- [2026-07-05] Initialized Next.js 16 + TypeScript + Tailwind CSS v4 project at repo root; installed shadcn/ui (base-nova preset), `better-sqlite3`, and `next-themes`; created base folder structure (`app/`, `components/`, `lib/`, `providers/`, `templates/`, `database/`, `migrations/`, `types/`); built sidebar/top navigation shell with dark-mode-default theme toggle; verified clean production build with no TypeScript errors (files modified: .gitignore, package.json, package-lock.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs, app/layout.tsx, app/page.tsx, app/globals.css, components/theme-provider.tsx, components/theme-toggle.tsx, components/app-shell.tsx, components/ui/button.tsx, lib/utils.ts, components.json; directories created: app, components, lib, providers, templates, database, migrations, types)
