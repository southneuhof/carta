# UI review and completion gate

Every changed `apps/web` module must pass all three gates below before
implementation is marked `Current`. Source review alone does not prove rendered
layout or contrast.

## 1. Static and lint gate

- Run web lint, type check, and `pnpm run test:surface-architecture`.
- Resolve every new native-control `vue/no-restricted-syntax` warning
  (`button`, `input`, `select`, `textarea`) in changed files instead of
  ignoring warnings because ESLint exits 0. Keep a slot-override warning
  (`#row-actions`, `#actions`) only when the design requires that custom action.
- Confirm every custom component or native control still has an unsupported
  requirement verified against [capabilities.md](capabilities.md).

## 2. Source contract trace

- Trace one representative create or edit flow from loader through draft
  mapping, submit, and cache invalidation.
- Trace one custom workflow command through permission, `allowedOperations`,
  bound `command.can` and `command.run`, and cross-resource invalidation.
- Confirm:
  - `ListView` keeps the default `Create` label unless the approved design
    explicitly requires custom wording.
  - Plain-text textarea fields use plain-text display, never `renderer: 'html'`.
  - Calendar dates use one consistent renderer (`renderer: 'date'`) across
    changed forms, labels omit `(required)` text, and `TableInput` never uses
    `renderer: 'separator'` as a fake column.
  - Top-level sidebar custom pages pass `:back-to="false"` to `NavigationHeader`.
  - Detail page `load` placement and empty-value placeholders (`-`) are
    consistent across sibling modules.

## 3. Rendered visual inspection

Start the development app and inspect changed pages in a real browser (desktop
1440px to 1600px in light mode, plus 375px narrow width and dark mode for
custom workspaces). Check every item directly on the rendered pixels:

1. **Table readability.** Primary columns (status, priority, dates, key
   amounts) stay visible on desktop without silent clipping behind sticky row
   actions, and row actions stay compact.
2. **Containment discipline.** Peer sections below `DetailView` sit inside
   consistent `Card` containers rather than floating bare on the background,
   and no `Card` is nested inside another `Card`.
3. **Secondary content in dialogs.** Read-only audit metadata, technical
   details, and activity logs open in a `Dialog` from an action button rather
   than stacking inline disclosures or low-priority tabs on the page.
4. **Calm filters.** Filter controls stay compact and aligned with matching
   control height and zero stray floating switches.
5. **Button emphasis and parity.** Primary actions and selected buttons use
   high-contrast `variant="filled"` (never washed-out `tonal` on
   `surfaceContainer`), sibling header buttons share framework `Button`
   styling, and chips share one variant per page.
6. **Spatial stability.** In custom interactive workspaces, selecting a record
   keeps sibling comparison panels visible without pushing them below the fold.
7. **Narrow screen and dark theme.** At 375px, sections stack cleanly in
   logical task order with no horizontal overflow, no nested scroll traps, and
   clearance above the bottom-right navigation pill. All text, cards, and chips
   stay readable in dark mode.

Select automated runtime and browser proof through
[$verify-carta-module](../../verify-carta-module/SKILL.md). For
documentation-only changes, check source facts, links, and scope.
