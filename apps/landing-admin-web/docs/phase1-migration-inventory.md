# Phase 1 Migration Inventory (Non-Calculator)

## Scope Contract
- Include: Dashboard, Website, Artikel, Pengguna, Collection, Form, Company Profile.
- Exclude: Kalkulator menu, `calculatorType`, `calculatorField`, `calculatorDetailField`, calculator formula editor, calculator section admin editing.
- Old framework internals are not migration targets: generic CRUD actions, base table/detail/form primitives, input renderers in `@southneuhof/is-vue-framework`, and base buttons/cards/dialogs/toasts handled by framework components.

## Menu and Route Inventory
Source references:
- Old: `apps/hkr-landing-admin-old-reference/src/menu.ts`
- New current: `apps/landing-admin-web/src/menu.ts`

Old menu modules/routes:
- `dashboard` -> `dashboard`
- `website` -> `website`
- `article` -> `articleCategory`, `article`
- `user` -> `user`, `role`, `roleGroup`, `permission`
- `collection` -> `collection`
- `form` -> `formType`, `formSubmission`
- `calculatorType` -> `calculatorType` (excluded)
- `companyProfile` -> `companyProfile`

Current new menu routes are still starter placeholders under `settings` (`users`, `roles`, `tasks`) and do not yet match HKR target modules.

## Config Inventory (Old App)
Source: `apps/hkr-landing-admin-old-reference/src/app/configs/*.ts`, `.../collections/*.ts`

Classification summary:
- Include (map to new models): `article*`, `content*`, `menu*`, `submenu*`, `form*`, `collection*`, `companyProfile` (from views/model usage), `user/role/roleGroup/permission` (from views + APIs), dashboard custom view.
- Exclude-calculator: `creditPeriodSimulation`, `creditSimulationDownPayment`, `creditSimulationStoryboard`, `clusterCreditSimulation`, `unitCreditSimulation`, calculator section config.
- Obsolete/legacy likely not in target scope: `adBanner*`, `language`, `layoutType`, `customerMessage` (not in requested include list; keep as `verify-api` only if requested later).
- Replaced by shared schema/framework: `_defaults.tsx`, generic input/table/form conventions.

Planned future model files in `apps/landing-admin-web/src/models/*.ts` (to be added in later phases):
- `menuItem`, `menuItemTranslation`, `page`, `pageTranslation`, `sectionGroup`, `section`, `content`, `gallery`
- `article`, `articleCategory`, `articleTranslation`
- `user`, `role`, `roleGroup`, `permission`
- `collection`
- `formType`, `formField`, `formSubmission`
- `companyProfile`

## Custom View Inventory (Old App)
Source: `apps/hkr-landing-admin-old-reference/src/views/authenticated/**`

Grouped port targets:
- Website/page builder: deep nested editors under `website/website/_layouts/**`.
  - Port targets: `MenuItemList/View/Settings`, `MenuMappingRoleMenuItem`, `MenuItemDetail`, `SectionAddWizard`, `SectionEditor`, `SectionGroupEditor`, `ContentEditor`, `GalleryEditor`, section-specific custom editors.
  - Exclude-calculator component: `_Custom/CalculatorDetail.vue`.
- Article:
  - CRUD wrappers (`article.vue`, `articleCategory.vue`) -> replace with `CRUDComposite` + model config.
  - Custom mapping panel: `mappingRoleArticleCategory.ts` -> needs custom port.
  - Detail under-layout (`ArticleDetailUnder.vue`) -> needs custom port for translation/draft/copy UX.
- Form:
  - CRUD wrappers (`formType.vue`, `formSubmission.vue`) -> replace with `CRUDComposite` + model config.
  - Custom: `FormFieldsConfig.vue`, `MappingRoleFormType.vue` -> needs custom port.
- User/role/permission:
  - CRUD wrappers for user/role/roleGroup/permission -> replace with framework.
  - Custom mapping: `mappingPermissionRole.ts` -> needs custom port.
- Collection:
  - `collection.vue` mostly CRUD; `CollectionItem.vue` may remain custom for JSON-like `data` editing.
- Company Profile:
  - `companyProfile.vue` with bespoke form composition -> needs custom port.
- Dashboard:
  - `dashboard.vue` + chart/filter widgets -> needs custom port to `/api/dashboard`.

## Section Type Inventory and Schema Gap
Sources:
- Old admin section configs: `apps/hkr-landing-admin-old-reference/src/app/configs/sectionTypes/**`
- Backend runtime sections: `apps/landing-mjl/src/lib/sections/*`
- Shared schema package: `packages/landing-section-schema/src/sections/*`

Old section type codes (non-calculator):
- Artikel: `article-highlights`, `article-list`
- Banner: `content-banner`, `general-banner`, `general-hero-banner`, `hero-banner-two`, `hero-banner`, `text-banner`
- Business: `form`, `project-categories`, `project-highlight-list`, `project-list`
- Elements: `content-default`, `content-gallery`, `content-icon`, `image-card`, `single-media`
- Highlights: `grid-key-highlights`, `key-highlights`
- Showcase: `carousel`, `categorized-photo-gallery`, `photo-gallery`, `product-showcase`, `quote-gallery`, `testimonials`, `timeline`
- Utility: `chart`, `data-list`, `floating-contact-button`, `location-map`, `page-list`, `popup-banner`, `quick-access`
- Excluded-calculator: `calculator`

`landing-mjl` has all old types including calculator and `timeline-carousel`.
Shared schema package currently has only:
- `content-default`, `content-gallery`, `data-list`, `hero-banner`, `hero-banner-two`

Schemas that must be added later (non-calculator):
- `article-highlights`, `article-list`, `content-banner`, `general-banner`, `general-hero-banner`, `text-banner`, `form`, `project-categories`, `project-highlight-list`, `project-list`, `content-icon`, `image-card`, `single-media`, `grid-key-highlights`, `key-highlights`, `carousel`, `categorized-photo-gallery`, `photo-gallery`, `product-showcase`, `quote-gallery`, `testimonials`, `timeline`, `chart`, `floating-contact-button`, `location-map`, `page-list`, `popup-banner`, `quick-access`.

Admin metadata fields to preserve per section while porting:
- `info` (name/description/category grouping)
- `meta` (`fields`, `fieldsAlias`, `inputConfig`, `defaultValues`, dependencies)
- `structure` tree (content/gallery/section/sectionGroup/custom)
- Custom editor/component hooks (e.g. `ArticleList`, `FormDetail`, `DataListGalleryEditor`, mapping helpers)

## Backend Model Contracts (`landing-mjl`)
Source: `apps/landing-mjl/src/lib/app/api/models/*.ts`

Generic contract pattern expected for included modules:
- `/:model/list`, `/:model/detail`, `/:model/create`, `/:model/update`, `/:model/delete`, `/:model/reorder`, `/:model/verify`
- Actual availability varies by model config.

Included model notes:
- Website/page-builder:
  - `menuItem`: list/detail/create/update/delete + role-scoped access, translation bootstrap, nested page summary.
  - `menuItemTranslation`: detail/update.
  - `page`: create/delete; create auto-generates `pageTranslation` records and `sectionGroup`.
  - `pageTranslation`: verify workflow (`DRAFT/REVIEW/PUBLISHED`) and publish/reset lifecycle.
  - `sectionGroup`: detail (sections ordered).
  - `section`: detail/update/delete/reorder with `ensureDraftState` mapping.
  - `content`: detail/list/create/update/delete/reorder with draft-aware ID remapping.
  - `gallery`: detail with foreign `contents`.
- Artikel:
  - `articleCategory`: list/detail/create/update/delete + role-scoped access + translation bootstrap.
  - `article`: list/detail/create/update/delete + category relation + access control + translation prioritization.
  - `articleTranslation`: detail/update/delete/verify; draft-first detail resolution and publish swap lifecycle.
- Form:
  - `formType`: list/detail/create/update/delete + role-scoped access.
  - `formField`: list/detail/create/update/delete/reorder.
  - `formSubmission`: list/detail/update/delete with role-scoped filtering and flattened payload lifecycle.
- Pengguna:
  - `user`: list/create/update/delete (password hash + auth account lifecycle).
  - `role`, `roleGroup`, `permission`: CRUD with basic relations and filters.
- Collection:
  - `collection`: list/detail/create/update/delete keyed by `code`; detail returns `data` payload directly.
- Company Profile:
  - `companyProfile`: update-focused model (`by: id`) with validation.

Calculator models exist in backend but intentionally excluded from new admin consumption:
- `calculatorType`, `calculatorField`, `calculatorDetailField`.

## Custom Endpoint Contracts
Source: `apps/landing-mjl/src/routes/api/**`

- `mappingPermissionRole/list` (`GET`): query `role_id` (+ pagination/search), returns permission rows with `active`.
- `mappingPermissionRole/toggle` (`POST`): body `{ role_id, permission_code, active }`.
- `mappingRoleArticleCategory/list` (`GET`): query `article_category_id`, returns role rows with `active`.
- `mappingRoleArticleCategory/toggle` (`POST`): body `{ article_category_id, role_id, active }`.
- `mappingRoleFormType/list` (`GET`): query `form_type_id`, returns role rows with `active`.
- `mappingRoleFormType/toggle` (`POST`): body `{ form_type_id, role_id, active }`.
- `mappingRoleMenuItem/list` (`GET`): query `menu_item_id`, returns role rows with `active`.
- `mappingRoleMenuItem/toggle` (`POST`): body `{ menu_item_id, role_id, active }`.
- `pageTranslation/create-draft` (`POST`): body `{ page_translation_id }`, returns `{ draft: { id, status_code } }`.
- `articleTranslation/create-draft` (`POST`): body `{ article_translation_id }`, returns draft translation.
- `articleTranslation/copy` (`POST`): body `{ source_id, destination_id }`, copies translation content fields.
- `sectionGroup/addSection` (`POST`): body includes `{ section_group_id, config, page_translation_id?, name? }`; draft-aware add + structure build.
- `sectionGroup/copy` (`POST`): body `{ source_id, destination_id }`.
- `dashboard` (`GET`): query `{ start_month, end_month, event_type }`, returns chart-ready aggregates.
- `upload/[destination]` (`POST`): authenticated file upload handler by destination.
- `me` (`GET`): returns user profile, role, permission codes, and `isPrivilegedRole`.

## Target Framework Readiness (`landing-admin-web`)
Sources:
- `apps/landing-admin-web/src/main.ts`
- `apps/landing-admin-web/src/router/index.ts`, `guards.ts`, `navigation.ts`
- `apps/landing-admin-web/src/router/__tests__/routes.spec.ts`
- `apps/landing-admin-web/src/framework/behaviors/*`, `stores/*`, `layouts/*`, `utils/services.ts`

Ready now:
- Framework parser + behavior adapter wiring exists.
- Dynamic layout route building exists via `buildLayoutRoutes`.
- Auth guard and post-login redirect behavior exists.
- Route inference tests confirm layout-prefixed routes.

Needs later changes:
- Menu and authenticated view tree still reflect starter modules (`settings/users/roles/tasks`).
- HKR modules/views/models/services are not yet wired.
- Mapping panels, page-builder nested editors, and dashboard widgets still missing.

Route inference requirement confirmed:
- Target views must follow `src/views/authenticated/{module}/{route}/{route}.vue` pattern (see route tests using inferred paths like `/authenticated/settings/users`).

## Final Checklist Table
Status enum: `include`, `exclude-calculator`, `replace-with-framework`, `needs-custom-port`, `needs-schema-port`, `verify-api`.

| Feature | Old Source | Target Module | Backend Model/API | Port Type | Dependencies | Notes | Status |
|---|---|---|---|---|---|---|---|
| Dashboard | `views/authenticated/dashboard/dashboard/*` | `authenticated/dashboard/dashboard` | `/api/dashboard` | dashboard widget | chart.js, filters, permission `view-dashboard` | Custom page needed, not plain CRUD | needs-custom-port |
| Website Menu Tree | `views/authenticated/website/website/_layouts/list/*` | `authenticated/website/website` | `menuItem`, `menuItemTranslation`, mapping role endpoints | custom UI + CRUD | role mapping, nested menu/page state | Includes role-based editability and page status badges | needs-custom-port |
| Website Page/Section Editor | `views/authenticated/website/website/_layouts/detail/*` | `authenticated/website/website` | `page`, `pageTranslation`, `sectionGroup`, `section`, `content`, `gallery`, `sectionGroup/addSection`, `sectionGroup/copy`, `pageTranslation/create-draft` | section editor | section schemas, draft lifecycle, upload | Core non-generic migration surface | needs-custom-port |
| Website Section Schemas | `app/configs/sectionTypes/**` (except calculator) | `packages/landing-section-schema/src/sections/*` | `sectionType` + section runtime codes | schema port | shared schema package, section meta/structure | Many old section codes missing in shared package | needs-schema-port |
| Website Calculator Section Editor | `_Custom/CalculatorDetail.vue`, `sectionTypes/Business/calculator.ts` | none | calculator models/endpoints | excluded | n/a | Explicitly out of scope | exclude-calculator |
| Artikel Category CRUD | `views/authenticated/article/articleCategory/*` | `authenticated/article/articleCategory` | `articleCategory`, `articleCategoryTranslation` | standard CRUD | role-scoped category access | Base screens can use `CRUDComposite` | replace-with-framework |
| Artikel Category Role Mapping | `mappingRoleArticleCategory.ts` | `authenticated/article/articleCategory` | `mappingRoleArticleCategory/list|toggle` | mapping panel | role list endpoint | Toggle UI required | needs-custom-port |
| Artikel CRUD | `views/authenticated/article/article/*` | `authenticated/article/article` | `article`, `articleTranslation`, `articleTranslation/create-draft`, `articleTranslation/copy`, `verify` | CRUD + custom | translation drafts, verify flow | CRUD base + custom translation actions | needs-custom-port |
| Pengguna CRUD | `views/authenticated/user/user/*` | `authenticated/user/user` | `user` | standard CRUD | role lookup, password lifecycle | Framework CRUD is sufficient with model config | replace-with-framework |
| Role CRUD | `views/authenticated/user/role/*` | `authenticated/user/role` | `role`, `roleGroup` | standard CRUD | permissions relation | Base CRUD + relation fields | replace-with-framework |
| Role-Permission Mapping | `views/authenticated/user/role/mappingPermissionRole.ts` | `authenticated/user/role` | `mappingPermissionRole/list|toggle` | mapping panel | permission list endpoint | Dedicated toggle table needed | needs-custom-port |
| Role Group CRUD | `views/authenticated/user/roleGroup/*` | `authenticated/user/roleGroup` | `roleGroup` | standard CRUD | none | Mostly direct model mapping | replace-with-framework |
| Permission CRUD | `views/authenticated/user/permission/*` | `authenticated/user/permission` | `permission` | standard CRUD | none | Code-keyed model (`by: code`) | replace-with-framework |
| Collection | `views/authenticated/collection/collection/*` | `authenticated/collection/collection` | `collection` | custom UI + CRUD | JSON `data` editing UX | CRUD possible, editor for `data` likely custom | needs-custom-port |
| Form Type CRUD | `views/authenticated/form/formType/*` | `authenticated/form/formType` | `formType` | standard CRUD | role access | Base list/detail/create/update/delete | replace-with-framework |
| Form Type Fields Config | `FormFieldsConfig.vue` | `authenticated/form/formType` | `formField` (+ reorder) | custom UI | drag reorder, type-specific field config | Nested editor required | needs-custom-port |
| Form Type Role Mapping | `MappingRoleFormType.vue` | `authenticated/form/formType` | `mappingRoleFormType/list|toggle` | mapping panel | role list endpoint | Toggle UI required | needs-custom-port |
| Form Submission Inbox | `views/authenticated/form/formSubmission/*` | `authenticated/form/formSubmission` | `formSubmission` | standard CRUD | date filters, role-scoped list | Detail payload flattening from lifecycle | replace-with-framework |
| Company Profile | `views/authenticated/companyProfile/companyProfile/*` | `authenticated/companyProfile/companyProfile` | `companyProfile` | custom form | social links, subsidiaries | Update-focused model; bespoke screen likely | needs-custom-port |
| Upload service | old inputs/media editors | shared service helper | `/api/upload/[destination]` | service adapter | framework upload behavior | Keep as shared infra, no copy from old widget internals | replace-with-framework |
| Session bootstrap | old auth/user bootstrap | app shell/stores | `/api/me` | service adapter | auth guard, permissions store | Needed before permissions-gated menu works | verify-api |
| Calculator menu/module | `menu.ts` `calculatorType` + `views/authenticated/calculatorType/*` | none | calculator models | excluded | n/a | Must not appear in target inventory | exclude-calculator |

## Validation Coverage (Phase 1)
- Every old menu route accounted: yes (all include/exclude above).
- Every old section type accounted: yes (`calculator` excluded, others mapped as schema-port candidates).
- Included features have matching backend models/endpoints in `landing-mjl`: yes, recorded above.
- Calculator files removed from included target inventory: yes.
