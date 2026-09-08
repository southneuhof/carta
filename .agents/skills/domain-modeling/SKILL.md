---
name: domain-modeling
description: Define Carta application terms in CONTEXT.md or record a consequential domain decision in an ADR.
---

# Domain modeling

Use this skill when terms or domain boundaries need to change. Reading an
existing glossary does not require a separate modeling task.

1. Read the existing `CONTEXT.md`, or follow `CONTEXT-MAP.md` when present.
   Compare the disputed term with the user example and the owning code.
2. Resolve meanings with concrete cases. Separate current behavior from the
   requested behavior. Ask only when the difference changes the product rule.
3. Record confirmed terms with [CONTEXT-FORMAT.md](CONTEXT-FORMAT.md). Create a
   glossary only when there is a term to retain. Keep implementation details
   and ordinary feature decisions in their source or module design.
4. Use [ADR-FORMAT.md](ADR-FORMAT.md) for an agreed decision that is costly to
   reverse, surprising without context, and the result of a real trade-off.
   Record the reason and relevant alternatives; ordinary local choices need
   no ADR.

The module design owns business behavior and approval. Glossaries and ADRs
clarify its language and boundaries; they do not create another approval gate.
Complete when each changed term has one meaning and each recorded decision has
an identifiable authority. Report unresolved conflicts with the affected rule.
