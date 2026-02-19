# Copilot instructions for Real Calendar

Purpose
- Obsidian plugin (CommonJS) that renders calendar events sourced from Markdown frontmatter.

Quick entrypoints
- Plugin owner/state: [main.ts](main.ts)
- Full-view UI: [src/RealCalendarView.ts](src/RealCalendarView.ts)
- Embed renderer: [src/RealCalendarEmbedRenderer.ts](src/RealCalendarEmbedRenderer.ts)
- Event creation UI: [src/CreateEventModal.ts](src/CreateEventModal.ts)
- Date helpers: [src/utils/dateUtils.ts](src/utils/dateUtils.ts)
- Styles: [styles.css](styles.css)

Essential data model
- `EventItem`: minimal fields `date`, `title`, `file`, `done`; optional `startTime`/`endTime`. Look in `main.ts` where events are stored in-memory.

Key conventions (must follow exactly)
- Dates: strict `YYYY-MM-DD` — use `parseDateString()` / `isValidDateString()` in [src/utils/dateUtils.ts](src/utils/dateUtils.ts).
- Times: strict `HH:MM` — validated with `isValidTimeString()`; ranges compared lexicographically after validation.
- Frontmatter selection: files must include a `tags` entry containing `event` and a valid `date` to be ingested.
- Frontmatter ordering: new event files are created using `fieldOrder` + `frontmatterFields` from [src/CreateEventModal.ts](src/CreateEventModal.ts). Do not bypass that logic when adding files programmatically.
- Paths: normalize with `normalizePath()` before reading/writing the configured `eventFolder`.
- CSS contract: styles were namespaced with the `real-calendar-` prefix to avoid collisions (examples: `real-calendar-calendar-event`, `real-calendar-event-done`, `real-calendar-week-view`). If you change class names, update both [styles.css](styles.css) and all usages in `src/*.ts`.

Data flow and integration points
- Initial scan: `rescanVault()` (batched, chunks of 20). Parsing happens in `extractEventFromFile()` using `parseYaml`.
- Incremental updates: use `updateSingleFile()` on create/modify and `removeFileEvent()` on delete; renames trigger a debounced full refresh.
- Cache & persistence: settings and event cache are saved together via `saveData({ ...settings, events })` — preserve this shape.
- Startup: `backgroundInit()` loads events after layout; guard UI actions with `ensureInitialized()`.

Developer workflows (commands)
- Install: `npm install`
- Build (prod): `npm run build`
- Dev/watch: `npm run dev`
- Debug build (no terser): `npm run build:dev`
- Lint: `npx eslint .`

When you change frontmatter fields or rendering
- Update these in lockstep:
  - defaults and settings shape in [main.ts](main.ts)
  - settings UI in [src/RealCalendarSettingTab.ts](src/RealCalendarSettingTab.ts)
  - file creation in [src/CreateEventModal.ts](src/CreateEventModal.ts)
  - parsing in `extractEventFromFile()` (main.ts)
  - rendering classes in [src/RealCalendarView.ts](src/RealCalendarView.ts) and [src/RealCalendarEmbedRenderer.ts](src/RealCalendarEmbedRenderer.ts)

Example event frontmatter (must include `tags: [event]` and `date`):
```yaml
---
title: Team meeting
date: 2026-02-25
tags: [event]
startTime: "09:00"
endTime: "10:00"
done: false
---
```

Notes for agents
- Prefer using the existing helper methods over ad-hoc parsing (see `dateUtils` and `extractEventFromFile`).
- Small, focused changes are preferable; keep persistence shape and CSS class names stable.
- Run `npm run dev` while iterating to speed up rebuilds; use `npm run build` for production bundles.

If anything here is unclear or you need more examples (e.g., more frontmatter variants), tell me what to expand.
