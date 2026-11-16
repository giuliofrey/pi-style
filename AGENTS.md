# Fork maintenance

Personal fork of https://github.com/quanpersie2001/pi-style, starting at v0.5.16 (1e47f95).
Keep the MIT license and upstream attribution. Preserve package identity, commands,
settings, and shared integration symbols; this fork is installed from Git, not published to upstream npm.

## Local changes

- Proposed Edit diffs render inside the existing Edit call card while approval is pending.
- Preview I/O runs in `tool_execution_start`, only for the built-in Edit tool in TUI mode,
  using native argument preparation and matching with a no-op write backend.
- Renderers read cached previews, never the filesystem. Clear previews and invalidators
  on tool completion and session boundaries; reject late data from an older session.
- The preview is not an approval gate. Native execution and approval extensions retain control.

## Checks and updates

Run `npm install --package-lock=false` and `npm run check` (matching upstream CI's install approach).
The inherited v0.5.16 lockfile fails `npm ci` with missing `@emnapi/core` / `@emnapi/runtime` entries;
keep that known upstream issue separate from the preview patch.
Preview regressions live in `test/unit/edit-preview.test.ts` and `test/integration/edit-preview.test.ts`. Real approval-dialog evaluation remains in the
separate pi-protect project; its installed-package tests do not validate this checkout.

Keep `origin` pointed at giuliofrey/pi-style and `upstream` at quanpersie2001/pi-style.
Merge upstream without resetting or force-pushing over local changes, then run all checks.
Automatic upstream syncing is not configured. Do not run the inherited npm release workflow
for this fork: its package name and publishing target belong to upstream.
