# Orientation browser acceptance report

- Date: 2026-08-20
- App: `http://localhost:5173`
- API: `http://localhost:3000`
- Browser result: `PASS`
- Fixture policy: Temporary local user, role, permissions, syllabus, category,
  material, question, answer, mapping, role state, and attachment records.
- Cleanup result: Temporary records were deleted. A reload after cleanup opened
  `/auth/login`. A database query found zero temporary Browser records and zero
  `orientation-browser-%@example.com` users.

## Journey evidence

| URL and surface | Action and visible result | Fixture or result |
|---|---|---|
| `/dashboard` | The Orientation module showed `Silabus`, `Kategori Silabus`, and `Materi`. | Navigation resolved. |
| `/orientation/syllabus` | The list rendered `Silabus` with an empty state and create action. | PASS |
| `/orientation/syllabus/fadd3ee0-5859-4d6b-9468-cf85ae5ab76f/detail` | Created `Browser Final Orientation Syllabus`; detail showed the legacy fields and `Konfigurasi Ujian`. | Temporary syllabus; removed. |
| `/orientation/learning-materials/create` | Created `Browser Final Quiz Material` and selected `Browser Final Orientation Syllabus`. | Temporary material `9b31599a-166d-41b0-a9b6-ed511592b125`; removed. |
| `/orientation/learning-materials/9b31599a-166d-41b0-a9b6-ed511592b125/detail/questions` | Added `Which statement is correct?` with four answers and one correct answer. The UI showed `Pertanyaan berhasil disimpan.` | PASS; question cascade removed. |
| `/orientation/syllabus/fadd3ee0-5859-4d6b-9468-cf85ae5ab76f/detail` | Turned on `Ada ujian`; the `Materi` selector showed only `Browser Final Quiz Material`, then saved. | Current-syllabus scope PASS. |
| `/orientation/syllabus/fadd3ee0-5859-4d6b-9468-cf85ae5ab76f/detail` after reload | Detail showed `Ada ujian true`, `Jumlah Pertanyaan 1`, and the selected material. | Reload PASS. |
| `/orientation/syllabus-categories` and category detail | Created a temporary category. Tabs showed `Silabus` and `Daftar Role`; mapping add/remove and role toggle reloaded with the expected state. | Previous fixture `81665840-66e8-44c6-ba9c-88ee7e1d86eb`; removed. |
| `/orientation/learning-materials/c42ab4c6-2a92-47bd-95ea-33ad6298d713/detail/configuration` | Added and listed a temporary attachment. The UI showed `Attachment berhasil disimpan.` | Previous fixture; removed. |

## Check notes

- Current browser logs after the lookup-source fix had no new Orientation
  errors. Earlier stale logs recorded the lookup detail-action error before the
  final lookup fix; the flow was reloaded and passed after that fix.
- The final browser fixture user was temporary and had all 18 Orientation
  permissions. It was removed with its role, module, permissions, and session.
