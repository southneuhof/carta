# Emergency Simulation Topics

## Decision

Implement `master/emergency-simulation-topics` as one authenticated system
master-data resource. Keep the legacy business labels, CRUD entry, five seed
records, and the `Emergency Simulation` navigation group.

The visible resource field is `name` only. The API keeps the legacy technical
fields `code`, `description`, and `active`, plus audit fields. No child rows,
lookup endpoint, workflow action, project scope, or framework change is in
scope.

## Ownership and routes

- API owner: `apps/api/src/routes/emergency-simulation-topics/`
- Web owner: `apps/web/src/routes/(authenticated)/master-data/emergency-simulation-topics/`
- Navigation: `master-data`, after `master-data-number-configs`, separator
  `Emergency Simulation`
- API route: `/emergency-simulation-topics`
- Web routes: list, create, detail, and edit under
  `/master-data/emergency-simulation-topics`
- Permission realm: `system`
- Relation owner: none

## Field contract

| Field | Legacy label | Create | Update | Visible surfaces | Form |
|---|---|---|---|---|---|
| `name` | `Nama` | required | editable | list, detail, form | text |
| `code` | `Kode` | nullable unique, API only | API only | none | none |
| `description` | `Deskripsi` | nullable, API only | API only | none | none |
| `active` | `Status` | server default `true` | API only | none | none |
| audit fields | — | server supplied | server supplied | API only | none |

The API trims `name`, rejects blank values, normalizes blank `code` to null,
and records the authenticated user in audit fields. The web form uses the
standard resource path and exact legacy form messages: `Submit`,
`Berhasil menambahkan data!`, and `Berhasil mengubah data!`.

## Evidence

- Legacy config: `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/emergency-simulation-topics.ts`
- Legacy list surface:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/emergency-simulation-topics/emergency-simulation-topics.vue`
- Legacy model:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/EmergencySimulationTopics.php`
- Legacy migration:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_09_03_095055_create_emergency_simulation_topics.php`
- Legacy seed:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S04EmergencySimulationTopicsSeeder.php`
- Legacy menu and shared CRUD labels:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts` and
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/actions/BaseCRUD.ts`

The user request to make the module identical is the approval for this bounded
design. The standard repository validation and delete chrome remain the
approved framework differences used by the existing master-data modules.
