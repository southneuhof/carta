# Workflow strategy

Carta module development resumes from the strongest usable artifact and moves
only through missing stages.

| Current input | Next stage |
|---|---|
| Intent | Focused brainstorming, then design |
| Draft | Preserve settled decisions; resolve only material gaps |
| Approved design | Implementation planning |
| Approved plan | Delegated implementation |
| Partial implementation | Reconcile evidence and resume the first incomplete item |

Bounded work uses the generic `bounded-module` manifest, generator,
integration, and verifier. Complex work uses a design, worksheet, and the
minimum vertical plans. Both paths end with owned acceptance evidence and an
independent `$verify-carta-module` verdict when delegation is available.
