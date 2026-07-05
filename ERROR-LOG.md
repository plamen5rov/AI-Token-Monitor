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
| 2026-07-05 | `ReferenceError: SyncResult is not defined` when adding a provider (HTTP 500 on POST /providers) | `app/actions/sync.ts` had `export type { SyncResult }` at the end — a type re-export in a `"use server"` file. Next.js server action files can only export async functions; the compiler tried to treat the re-exported type as a runtime value, but since `SyncResult` was imported as `type`-only, it didn't exist at runtime. | Removed the `export type { SyncResult }` line. The type is already exported from `lib/sync.ts` and imported directly where needed. | Never use `export type { X }` (type re-exports) in `"use server"` files. Type declarations (`export type X = {...}`) are fine because they're erased at compile time, but re-exports of type-only imports fail at runtime. |
| 2026-07-05 | OpenAI sync failed: `Cannot convert argument to a ByteString because the character at index 325 has a value of 8203 which is greater than 255` | The API key pasted by the user contained a Unicode zero-width space (U+200B, value 8203), likely introduced by copy-pasting from a web page. HTTP headers must be Latin-1 (0-255), so `fetch()` rejects non-Latin-1 characters in the `Authorization` header. | Added `sanitizeApiKey()` in `app/actions/providers.ts` that strips zero-width spaces (U+200B–U+200F), BOM (U+FEFF), and non-breaking spaces (U+00A0) before encrypting and storing the key. | Always sanitize paste-from-web input for API keys — strip invisible Unicode characters (zero-width spaces, BOM, non-breaking spaces) before storing. These characters are invisible in the UI but break HTTP headers. |
| 2026-07-05 | OpenRouter sync failed: `403 Forbidden` | The `/activity` endpoint requires a **Management API key**, not a regular API key. The user used a regular key. | Improved the 403 error message in `providers/openrouter.ts` to explicitly mention Management key requirement and link to https://openrouter.ai/keys. | Provider adapters should return helpful, actionable error messages for common HTTP status codes (401, 403) rather than just echoing the status text. |
| 2026-07-05 | Deleting a provider failed: `SqliteError: FOREIGN KEY constraint failed` | `models` and `usage_records` tables have `FOREIGN KEY (provider_id) REFERENCES providers(id)` without `ON DELETE CASCADE`. When a provider has synced data (models, usage records), deleting the provider row violates the FK constraint. | Updated `deleteProvider()` in `lib/db.ts` to delete child rows in a transaction before the provider: `usage_records` → `usage_daily` → `models` → `sync_log` → `providers`. | When designing schemas with FK constraints, either use `ON DELETE CASCADE` or ensure the delete function removes child rows in the correct order within a transaction. Always test delete with data present, not just empty tables. |
