# Copilot instructions for Real Calendar

## Project purpose and runtime
- This is an Obsidian plugin (CommonJS bundle) that renders file-based calendar events from Markdown frontmatter.
- Entry point is main.ts (`RealCalendarPlugin`), and build output is main.js loaded by Obsidian.
- Core event schema is `EventItem` (`date`, `title`, `file`, `done`, optional `startTime`/`endTime`).

## Architecture and data flow
- `RealCalendarPlugin` in main.ts owns all shared state: `settings`, in-memory `events`, current view date, and active embed renderers.
- Full calendar tab UI is in src/RealCalendarView.ts (`ItemView`), while embedded calendars are in src/RealCalendarEmbedRenderer.ts (`MarkdownRenderChild`).
- Both tab and embed renderers reuse plugin state and helper methods (`getWeekStart()`, month/day labels) and are refreshed via `refreshCalendarView()`.
- Event ingestion pipeline:
  1. Vault files scanned (`rescanVault()` in chunks of 20).
  2. Frontmatter parsed in `extractEventFromFile()` via `parseYaml`.
  3. Only files with `tags` containing `event` and valid `date` are kept.
- Incremental sync is preferred over rescans: `updateSingleFile()` on create/modify, `removeFileEvent()` on delete, and debounced full refresh on rename.

## Critical conventions in this codebase
- Dates must be strict `YYYY-MM-DD`; validate with helpers in src/utils/dateUtils.ts (`parseDateString()`, `isValidDateString()`).
- Time strings are strict `HH:MM` and compared lexicographically after validation (`isValidTimeString()`, `isValidTimeRange()`).
- New event files are created only through frontmatter field order in settings (`fieldOrder` + `frontmatterFields`) from src/CreateEventModal.ts.
- Keep folder paths normalized with `normalizePath` when reading/writing `eventFolder` and creating files.
- Preserve the shared CSS class contract in styles.css (e.g., `calendar-event`, `event-done`, `week-view`) because both main view and embed renderer depend on it.

## Settings, persistence, and cache behavior
- Plugin settings are merged with defaults in `loadSettings()`; `fieldOrder` fallback is mandatory.
- Event cache is persisted alongside settings using `saveData({ ...settings, events })`; keep this shape compatible when changing persistence.
- Startup is intentionally non-blocking: `backgroundInit()` loads events after layout; `ensureInitialized()` gates user actions.
- Cache validation runs asynchronously (`validateCacheInBackground()`), then forces a rescan only when file-path sets differ.

## Developer workflows
- Install deps: `npm install`
- Production build: `npm run build`
- Watch mode for plugin development: `npm run dev`
- Non-minified debug-ish build: `npm run build:dev` (sets `NODE_ENV=development`, disables terser in rollup config)
- Linting uses ESLint flat config with all `eslint-plugin-obsidianmd` rules enabled; run manually with `npx eslint .` (no npm script defined).

## Integration points to update together
- If you add/change frontmatter fields, update all of:
  - defaults and settings shape in main.ts
  - field toggles/order UI in src/RealCalendarSettingTab.ts
  - file creation logic in src/CreateEventModal.ts
  - parsing logic in `extractEventFromFile()` in main.ts
- If you change event rendering/status classes, update both src/RealCalendarView.ts and src/RealCalendarEmbedRenderer.ts plus styles.css.
- If you add embed options, extend `parseEmbedOptions()` and `EmbedOptions` in main.ts and consume in src/RealCalendarEmbedRenderer.ts.
