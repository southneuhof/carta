# Orientation syllabus and learning materials design

- Status: `APPROVED`
- Feature: `orientation-syllabus-materials`
- Modules: `orientation/syllabus`, `orientation/syllabus-categories`, `orientation/learning-materials`
- Legacy source: `/Users/gamer/Documents/projects/ads-hk-legacy`
- Design authority: This file, after approval
- Discovery record: [worksheet.md](./worksheet.md)

## 1. Business model

`Silabus` is the learning path. `Materi` is an ordered item inside one
`Silabus`. `Kategori Silabus` is a catalogue group for users. One syllabus can
belong to many categories, and one category can contain many syllabi.

The category-to-syllabus relation is a mapping. The category detail screen
owns this mapping. The syllabus screen does not show a category selector.
Category role mappings control which user roles can see a category in the
learner catalogue.

The learner path is:

```text
role → Kategori Silabus → Silabus → ordered Materi → optional final quiz
```

The learner catalogue and learning-progress features are not part of this
module group. They remain a later feature unless the user adds them.

## 2. Legacy parity contract

Keep these user-facing labels and meanings:

| Surface | Label or behavior |
|---|---|
| Navigation | `Orientation`, `QHSSE Orientation`, `Silabus`, `Kategori Silabus`, `Materi` |
| Syllabus fields | `Judul/Tema Silabus`, `Foto Cover` |
| Category detail tabs | `Silabus`, `Daftar Role` |
| Syllabus detail | `Konfigurasi Silabus` |
| Quiz settings | `Ada ujian`, `Nilai minimal`, `Waktu pengerjaan`, `Acak pertanyaan`, `Acak jawaban` |
| Quiz material rows | `Materi`, `Jumlah Pertanyaan` |
| Learning material fields | `Judul`, `Silabus`, `Foto Cover`, `Konten Materi`, `Materi` for attachments |
| Quiz editor | `Soal Ujian`, `Pertanyaan`, `Pilihan Jawaban`, `Jawaban` |

The new web surface uses the current standard resource API, but it keeps the
legacy route purpose, labels, field order, selected defaults, and actions.

## 3. Data ownership

The API owns these records and relations:

| Owner | Data and relation |
|---|---|
| Syllabus | Name, cover, description, active state, quiz settings, and computed total question count |
| Syllabus category | Name, cover, description, and active state |
| Category-syllabus mapping | `syllabusCategoryId`, `syllabusId`, description, active state; unique pair |
| Category-role mapping | `syllabusCategoryId`, `roleId`, active state; unique pair |
| Learning material | `syllabusId`, name, type, cover, file, content, active state, and ordered position |
| Syllabus quiz material | `syllabusId`, `learningMaterialId`, and `totalQuestion`; unique pair |
| Learning material attachment | Material-owned name, file, description, and active state |
| Learning material question | Material-owned question text and active state |
| Question answer | Question-owned option text, answer flag, and active state |

Database rules:

- A learning material must reference an existing syllabus.
- A quiz material must reference a learning material owned by the same
  syllabus, must be a normal material, and must be quiz-enabled.
- A quiz material cannot be the reserved final quiz material.
- A quiz material pair is unique within one syllabus.
- Material display order is assigned by the API per syllabus. `0` is reserved
  for the final quiz material and is not shown in the normal material list.
- When syllabus quiz mode is enabled, the API creates or updates the reserved
  final quiz material from the syllabus quiz totals.
- Syllabus `totalQuestion` is the sum of configured quiz material rows.

The API must return named relation data for list, detail, create, and update
responses. The web form keeps scalar IDs for writes and uses relation names for
display.

## 4. API and permission design

Use the `system` authorization realm.

Each main module has the standard permissions:

```text
view-<module>
list-<module>
detail-<module>
create-<module>
update-<module>
delete-<module>
```

The category mapping and role toggle are child workflows owned by the
category detail surface. They use the category read permission for reads and
the category update permission for writes. The API still validates the parent
ID, relation IDs, uniqueness, and role state on every write.

The syllabus quiz-material rows, material attachments, and material questions
are child writes owned by their parent update or create workflow. They are not
standalone navigation modules.

Required API behavior:

- Standard authenticated list, detail, create, update, and delete routes for
  the three main resources.
- A category mapping read and bulk add/remove workflow.
- A category role read and active-toggle workflow.
- A syllabus detail read that includes quiz material rows.
- A syllabus update that validates and synchronizes quiz material rows and the
  reserved final quiz material in one transaction.
- A learning material detail read that includes attachments and quiz data.
- A learning material create/update workflow that validates child attachments.
- A question create/update/delete workflow that keeps the parent material quiz
  flag and question count current.

## 5. Web surface design

Use the current schema-bound resource API with `defineResource`,
`ListView`, `DetailView`, and `FormView` for standard CRUD.

### `orientation/syllabus`

- List: standard rows for `Judul/Tema Silabus`, cover, description, and active
  state.
- Create and edit: standard syllabus fields.
- Detail: standard detail followed by `Konfigurasi Silabus`.
- Quiz configuration: route-owned child form. Show quiz fields only when
  `Ada ujian` is active. Show the quiz material table with `Materi` and
  `Jumlah Pertanyaan`.
- The quiz material lookup is filtered by the current syllabus ID and excludes
  final quiz materials. The server applies the same rule.

### `orientation/syllabus-categories`

- List, create, edit, and detail: standard category CRUD.
- Detail tabs: `Silabus` and `Daftar Role`.
- `Silabus`: show mapped syllabi and allow multi-add from the owning syllabus
  list. Exclude syllabi already mapped to the current category.
- `Daftar Role`: show roles and allow the legacy active toggle.
- Do not add a category selector to the syllabus form.

### `orientation/learning-materials`

- List: show `Judul`, related `Silabus`, and description. Exclude the reserved
  final quiz material.
- Create and edit: require `Judul`, `Silabus`, `Konten Materi`, and the legacy
  attachment behavior. The API assigns display order.
- Detail: show content, file, attachments, quiz configuration, and `Soal
  Ujian` when the material has a quiz.
- Question editor: manage questions and answer options. Keep one correct
  answer per question, matching the legacy behavior.

Relation selectors use the owning resource as their source. They do not use a
consumer-owned options endpoint.

## 6. Execution order

1. Database entities, relations, constraints, and audit fields.
2. Authenticated API routes, schemas, permissions, and transaction rules.
3. Typed web actions and response normalization.
4. Web schemas, field catalogs, resources, and relation selectors.
5. Standard CRUD routes and the approved category, quiz, attachment, and
   question child surfaces.
6. Focused API and web checks, then the authenticated browser acceptance flow.

## 7. Explicit non-goals

- No category selector on the syllabus form.
- No global learning-material options endpoint owned by the consumer.
- No learner catalogue, learning progress, exam session, or certificate flow.
- No compatibility routes for the legacy API.
- No framework package change.

## 8. Approval gate

Implementation must not start until this design is approved. Any change to
the relation ownership, quiz material scope, labels, permissions, or learner
scope requires a design update before implementation.
