# ERROR-LOG.md

Error log for the AI Token Monitor (ATM) project.

Format:

| Date | Mistake | Root Cause | Fix | Lesson Learned |
|------|---------|------------|-----|----------------|
| ...  | ...     | ...        | ... | ...            |

---

## Log

| Date | Mistake | Root Cause | Fix | Lesson Learned |
|------|---------|------------|-----|----------------|
| 2026-07-05 | React hydration mismatch warning in dev console | Dark Reader browser extension injects `data-darkreader-inline-stroke` and inline styles into SVG icons before React finishes hydration | No code change needed — dev-only artifact caused by the extension. If a clean console is required, render icons client-only. | Browser extensions that mutate the DOM can cause React hydration warnings that look like app bugs. Check extensions before debugging hydration issues. |
