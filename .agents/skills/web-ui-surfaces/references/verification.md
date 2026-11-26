# UI review and completion gate

Every changed `apps/web` module must pass all three gates below before
implementation is marked `Current`. Source review alone does not prove rendered
layout, visual hierarchy, or contrast.

## 1. Static and lint gate

- Run web lint, type check, and `pnpm run test:surface-architecture`.
- Resolve every new native-control `vue/no-restricted-syntax` warning
  (`button`, `input`, `select`, `textarea`) for standard buttons, filters, and
  dialogs instead of ignoring warnings because ESLint exits 0. Keep a warning
  only for a justified `#row-actions` or `#actions` slot override, or for a
  full-row multi-line selectable list item (`<button type="button">` with
  `aria-pressed`) where Loom has no list-item component. Never distort a
  selectable row into a pill button around a record ID to silence a warning.
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
  - Standard CRUD detail pages keep `DetailView`'s single default card, and no
    card stacks two separate `<Detail>` components.
  - Plain-text textarea fields use plain-text display, never `renderer: 'html'`.
  - Calendar dates use one consistent renderer (`renderer: 'date'`) across
    changed forms, labels omit `(required)` text, and `TableInput` never uses
    `renderer: 'separator'` as a fake column.
  - Top-level sidebar custom pages pass `:back-to="false"` to `NavigationHeader`.
  - Detail page `load` placement, `tabular-nums` alignment, and empty-value
    placeholders (`-`) are consistent across sibling modules.

## 3. Rendered visual inspection

Start the development app and inspect changed pages in a real browser across
**all three view states**: desktop (1440px to 1600px) in light mode, narrow
(375px) mobile width, and dark mode on custom workspaces. Capture and verify
every item directly on the rendered pixels:

1. **Squint test and spatial hierarchy.** With detail blurred, page header,
   primary work area, and supporting panels read in clear order. Custom
   workspaces give the primary work region width dominance (never an equal
   3-column wall of identical cards), auto-select the first queue item when
   present so no blank stub appears, and group queue rows inside one divided
   `Card` rather than stacking many separate bordered cards.
2. **Table readability.** Primary columns (status, priority, dates, key
   amounts) stay visible on desktop without silent clipping behind sticky row
   actions, and row actions stay compact.
3. **Containment discipline.** Peer sections below `DetailView` sit inside
   consistent `Card` containers rather than floating bare on the background,
   and no `Card` is nested inside another `Card`.
4. **Secondary content in dialogs.** Read-only audit metadata, technical
   details, and activity logs open in a `Dialog` from `variant="text"` buttons
   with icons rather than stacking inline disclosures or low-priority tabs.
5. **Calm filters and optical alignment.** Filter controls stay compact and
   aligned with matching height, zero stray floating switches, and zero
   pill-button filter toggles masquerading as actions. Flush-left links and
   text buttons align cleanly with surrounding copy, and form `Submit` buttons
   stay compact and right-aligned (never full-width).
6. **Action hierarchy, icons, and emphasis.** Header bars visually tier primary
   workflow actions (`filled` + icon), record controls (`outlined` + icon), and
   secondary reference dialogs (`text` + icon). Active selected buttons use
   `variant="filled"` with a leading `check` icon (never `tonal`). Form/dialog
   `Submit`/`Cancel` and repeated unselected `Choose` buttons omit icons. Chips
   share one variant per page.
7. **Spatial stability, narrow screen, and dark theme.** Selecting a record in
   a custom workspace keeps sibling comparison panels visible without pushing
   them below the fold. At 375px, sections stack cleanly in logical task order
   with zero horizontal overflow, zero nested scroll traps, and clearance above
   the bottom-right navigation pill. All text, cards, chips, and selected
   states remain readable in dark mode.

Select automated runtime and browser proof through
[$verify-carta-module](../../verify-carta-module/SKILL.md). For
documentation-only changes, check source facts, links, and scope.
