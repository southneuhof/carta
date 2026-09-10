"""Run with python3 -m unittest discover -s <this directory>."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from check_worksheet import check


class WorksheetCheck(unittest.TestCase):
    def test_coverage_and_completion(self):
        with TemporaryDirectory() as directory:
            folder = Path(directory)
            design = '''| Obligation | Rule references | Acceptance IDs |
|---|---|---|
| W-01.normal | B-01 | A-01 |
```yaml
id: B-01
```
```yaml
id: A-01
```
'''
            worksheet = '''- State: `DONE`
- Latest review: report.md
| Obligation | Acceptance IDs |
|---|---|
| W-01.normal | A-01 |

| Plan | File | Depends on | Status | Review |
|---|---|---|---|---|
| P-01 | 001-result.md | NONE | VERIFIED | report.md |

| Acceptance | Required surfaces |
|---|---|
| A-01 | BROWSER |

| Acceptance | Plan | Surface | Test case | Implementation | Red | Green | Review | Result |
|---|---|---|---|---|---|---|---|---|
| A-01 | P-01 | BROWSER | request.spec.ts::saves and reloads | app.ts:save | report.md | report.md | report.md | PASS |
'''
            (folder / 'design.md').write_text(design)
            (folder / 'worksheet.md').write_text(worksheet)
            plan = """- Acceptance: A-01
| Cycle | Acceptance IDs | Test case | Fixture / actor | Assertions | Expected red | Implementation owners | Review timing | Consequence |
|---|---|---|---|---|---|---|---|---|
| C-01 | A-01 | request.spec.ts::saves and reloads | request and user | persisted result | missing control | app.ts | after-plan | NONE |
"""
            (folder / '001-result.md').write_text(plan)
            (folder / 'report.md').write_text('Evidence')
            self.assertEqual(check(folder), [])
            for broken in [
                worksheet.replace('| W-01.normal | A-01 |', ''),
                worksheet.replace('| PASS |', '| PENDING |'),
                worksheet.replace('| P-01 | BROWSER', '| P-02 | BROWSER'),
                worksheet.replace('| NONE | VERIFIED', '| P-01 | VERIFIED'),
                worksheet.replace('| BROWSER |', '| UNKNOWN |'),
                worksheet.replace('| A-01 | BROWSER |', '| A-01 | API, BROWSER |'),
                worksheet.replace('| report.md | PASS', '| missing.md | PASS'),
            ]:
                (folder / 'worksheet.md').write_text(broken)
                self.assertTrue(check(folder), broken)
            (folder / 'worksheet.md').write_text(worksheet)
            for broken_plan in [
                plan.replace('| request.spec.ts::saves and reloads |', '| another test |'),
                plan.replace('| A-01 |', '| A-02 |'),
                plan.replace('| after-plan |', '| before-implementation |'),
                plan.replace('| NONE |', '| unauthorized action |'),
                plan.replace('| persisted result |', '| |'),
                plan.replace('- Acceptance: A-01', '- Acceptance: A-02'),
            ]:
                (folder / '001-result.md').write_text(broken_plan)
                self.assertTrue(check(folder))
            (folder / '001-result.md').write_text('- Acceptance: A-02')
            self.assertTrue(check(folder))
            (folder / '001-result.md').write_text(plan)
            api_row = '| A-01 | P-01 | API | api.spec.ts::stores result | app.ts:save | report.md | report.md | report.md | PASS |\n'
            combined = worksheet.replace('| A-01 | BROWSER |', '| A-01 | API, BROWSER |') + api_row
            api_cycle = '| C-02 | A-01 | api.spec.ts::stores result | request and user | persisted result | missing action | app.ts | after-plan | NONE |\n'
            (folder / 'worksheet.md').write_text(combined)
            # Every surface needs its planned test, even under one acceptance ID.
            self.assertTrue(check(folder))
            (folder / '001-result.md').write_text(plan + api_cycle)
            self.assertEqual(check(folder), [])
            for broken in [
                combined.replace('| BROWSER | request.spec.ts::saves and reloads', '| API | request.spec.ts::saves and reloads'),
                combined.replace('| API, BROWSER |', '| API |'),
                combined + api_row,
                combined.replace('| P-01 | API |', '| P-02 | API |'),
                combined.replace('| report.md | PASS |\n', '| report.md | PENDING |\n', 1),
            ]:
                (folder / 'worksheet.md').write_text(broken)
                self.assertTrue(check(folder), broken)
            (folder / 'worksheet.md').write_text(combined)
            extra_browser_row = api_row.replace('| API | api.spec.ts::stores result', '| BROWSER | request.spec.ts::filters records')
            extra_browser_cycle = api_cycle.replace('C-02', 'C-03').replace('api.spec.ts::stores result', 'request.spec.ts::filters records')
            (folder / 'worksheet.md').write_text(combined + extra_browser_row)
            self.assertTrue(check(folder))
            (folder / '001-result.md').write_text(plan + api_cycle + extra_browser_cycle)
            self.assertEqual(check(folder), [])
            (folder / 'worksheet.md').write_text(worksheet)
            (folder / '001-result.md').write_text(plan)
            (folder / 'design.md').write_text(design + '\n| Invariant ID | Condition that must remain true |\n|---|---|\n| I-01 | A required invariant |\n')
            self.assertTrue(check(folder))
            (folder / 'design.md').write_text(design.replace('```yaml', '| W-01.return | B-02 | A-02 |\n```yaml'))
            self.assertTrue(check(folder))


if __name__ == '__main__':
    unittest.main()
