# Toll Causes Accidents module design

## Approved scope

Implement `master/toll-causes-accidents` as an authenticated system master-data
module. Match the legacy title `Faktor Kecelakaan`, four category labels, and
the 25 seeded causes from `S54TollCausesAccidentsSeeder.php`.

## Data and API

Create `toll_causes_accidents_categories` and `toll_causes_accidents` tables. The cause
record has a required `categoryCode` foreign key, `name`, nullable unique `code`,
nullable `description`, `active`, and audit fields. Category rows are fixed
reference data and are not a separate user-facing CRUD module.

The API select contract also returns the related category under `category` with
its user-facing `name`. Define and load this backend relation for list, detail,
create, and update responses. The web resource keeps `categoryCode` for form
writes and reads `category.name` for list/detail display; it does not fetch or
map a label in the browser.

Expose standard authenticated CRUD at `/toll-causes-accidents`. The list route
accepts `categoryCode` and returns only matching causes when it is present.
Create and update validate the category code, trim text values, and enforce
unique cause codes. Use system permissions for view, list, detail, create,
update, and delete.

## Web flow

Use the standard `ListView`, `DetailView`, and `FormView` shells. The list route
uses `ChipFilter` with the exact legacy labels and codes, with `Pengemudi` as
the initial filter. The form uses a fixed four-option `Kategori` select and the
legacy business fields. List/detail display reads the backend `category.name`;
the browser does not fetch or map a category label. Routes use the existing
master-data navigation pattern.

## Verification

Add focused API route coverage for authentication, permission denial, category
filtering, category validation, audited CRUD, and duplicate codes. Add focused
web resource and route integration coverage for field order, filter query,
permissions, route targets, and navigation. Run the module checks, then verify
list, filter, create, edit, detail, reload, and delete in an authenticated
browser with a temporary record.

## Boundaries

Do not add a category CRUD screen, compatibility route, generic CRUD helper,
framework changes, or unrelated refactoring.
