# Overtime canonical contract

This repository keeps its existing overtime identity and workflow as the
authoritative contract. HKA TROM names are presentation aliases, not database
columns.

| Concern | Canonical contract | HKA compatibility |
|---|---|---|
| Identity | `id`: text UUID | Integer IDs are not migrated; routes treat IDs as opaque strings. |
| Applicant | `applicantEmployeeId` / `applicant_employee_id` | UI label: `Karyawan`; server derives it from caller identity. |
| Section | `sectionId` / `section_id` | UI label: `Ruas`; server derives it from caller identity. |
| Duration | `estimatedMinutes` / `estimated_minutes` | UI label: `Estimasi Lama Lembur`, unit `Menit`. |
| Status | `draft`, `waiting`, `approved`, `rejected` | Draft workflow is preserved; other statuses receive Indonesian labels. |
| Verification | `log_verifications` chain | Chain is sole source of truth; no duplicate legacy verification columns. |
| Realization | Unsupported | Deferred until an attendance subsystem can own realized start/end/duration. |
| Timestamps | ISO timestamp strings | Serialized unchanged at transport boundary. |

Create always overwrites `sectionId`, `applicantEmployeeId`,
`createdByUserId`, and `statusCode` from authenticated identity. Update schema
omits all four. Existing UUID rows require no migration or backfill, so Plan 030
intentionally produces no Drizzle migration.

List filters use camel-case transport keys: `sectionId`,
`applicantEmployeeId`, `startDate`, `endDate`, `jobPositionId`, and
`statusCode`. Date boundaries are inclusive calendar dates. Empty strings are
treated as absent. Authorization scope is always composed with filters.
