# Orientation syllabus and learning materials worksheet

- State: `DONE`
- Feature: `orientation-syllabus-materials`
- Modules: `orientation/syllabus`, `orientation/syllabus-categories`, `orientation/learning-materials`
- Grouping reason: Provisional grouping for one legacy workflow question: how syllabus categories and learning materials relate to syllabus.
- Folder: `plans/orientation-syllabus-materials/`
- Design: [design.md](./design.md) — approved by user
- Active plan: None; both numbered plans are independently verified.
- Next action: None.
- Read boundary: Approved design and direct evidence listed in this worksheet.
- Write boundary: This worksheet and numbered plan files under this feature folder.
- Last result: Independent verifier `PASS`; API and web implementation checks pass; authenticated browser gate passes; temporary records are removed.
- Last evidence: [browser-report.md](./browser-report.md), [01-build-orientation-api.md](./01-build-orientation-api.md), and [02-build-orientation-web.md](./02-build-orientation-web.md)
- Blocker: None. The approved current-syllabus quiz-material lookup scope is enforced by the API and web.

## Discovery evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | Legacy configs and models: `frontend-ads-vuejs/src/app/configs/syllabus.ts:1-14`, `.../syllabus-categories.ts:1-13`, `.../learning-materials.ts:3-88`; `backend-ads-laravel/app/Models/Syllabus.php:26-30`, `.../SyllabusCategories.php:26-30`, `.../LearningMaterials.php:26-30` | `syllabus` and `syllabus_categories` are separate records; `learning_materials.syllabus_id` points to `syllabus` | FOUND |
| Surface field placement and filters | `frontend-ads-vuejs/src/views/authenticated/orientation/syllabus/_layouts/SyllabusConfiguration.vue:13-109`; `.../syllabus-categories/_layouts/_layouts/MappingSyllabusCategories.vue:15-34`; `.../learning-materials.ts:6-49`; `backend-ads-laravel/app/Models/LearningMaterials.php:191-205` | Categories map syllabi from category detail; materials select a syllabus on create; quiz material rows are configured inside syllabus detail; normal material list excludes `display_order = 0` | FOUND |
| Legacy labels and behavior | `frontend-ads-vuejs/src/menu.ts:316-334`; exact configs and detail components | `Silabus`, `Kategori Silabus`, `Materi`; category detail has `Silabus` and `Daftar Role` tabs; syllabus detail has `Konfigurasi Silabus` | FOUND |
| Relation or child owner | `database/migrations/2024_11_20_130452_create_mapping_syllabus_categories.php:14-25`; `.../2024_11_14_172241_create_learning_materials.php:14-37`; `.../2024_11_26_144507_create_syllabus_learning_material_quiz.php:14-25` | `syllabus` ↔ `syllabus_categories` is many-to-many through `mapping_syllabus_categories`; `learning_materials` belongs to one syllabus; quiz counts use `syllabus_learning_material_quiz` | FOUND |
| Lookup consumer or dependency | `backend-ads-laravel/app/Models/MySyllabusCategories.php:134-165`; `.../MySyllabus.php:176-180`; `frontend-ads-vuejs/src/views/authenticated/orientation/my-syllabus-categories/_layouts/_layouts/MySyllabusDetailMain.vue:11-19` | User catalog filters categories by role, then syllabi by category, then materials by syllabus | FOUND |
| Workflow or custom write | `frontend-ads-vuejs/src/views/authenticated/orientation/syllabus-categories/_layouts/_layouts/MappingSyllabusCategories.vue:23-32`; `backend-ads-laravel/app/Models/Syllabus.php:223-277`; `.../LearningMaterials.php:202-205` | Category mapping uses bulk create; enabling a syllabus quiz creates or updates a hidden final-quiz material; material order is assigned server-side | FOUND |
| API permission realm and verbs | Explicit legacy services: `backend-ads-laravel/app/Services/SyllabusCategoriesRoles/ListSyllabusCategoriesRoles.php:15`, `.../UpsertSyllabusCategoriesRoles.php:23`; CRUD flags: `backend-ads-laravel/app/Models/Syllabus.php:21-25` and sibling models | CRUD is enabled for the three resources; exact generic permission names are not visible in the direct owner files | AMBIGUOUS |
| Route and navigation owner | `frontend-ads-vuejs/src/menu.ts:308-341`; view roots under `frontend-ads-vuejs/src/views/authenticated/orientation/` | Legacy navigation owns all three routes under `Orientation > QHSSE Orientation` | FOUND |
| Seed and reload requirement | Exact searches for `syllabus`, `syllabus_categories`, and `learning_materials` in legacy seeders and current `apps/api`/`apps/web` | No exact seed records or current module owners found | FOUND |
| Framework or UI gap | Exact current searches in `apps/api`, `apps/web`, and `docs` | Current modules are not present; gap assessment waits for approved design | FOUND |

## Plan map

| Plan | Scope | Depends on | Status | Evidence |
|---|---|---|---|---|
| `01-build-orientation-api.md` | Database, API, authorization, and focused API checks | `none` | DONE | Approved design, focused API report, and verifier PASS |
| `02-build-orientation-web.md` | Resources, routes, navigation, child workflows, and focused web checks | `01-build-orientation-api.md` | DONE | [browser-report.md](./browser-report.md), focused web checks, and verifier PASS |

## Cross-plan blockers and decisions

- Resolved: The API and web enforce the approved current-syllabus quiz-material scope. They do not copy the legacy global lookup behavior.
