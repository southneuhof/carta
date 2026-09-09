# Backend API conventions

Carta uses Hono, Sprindle and Drizzle in `apps/api`. The local
[API skill](../../.agents/skills/api-conventions/SKILL.md) owns implementation
instructions. [Sprindle reference](../../packages/sprindle/docs/reference.md)
owns framework vocabulary and public contracts.

- Use canonical factories in file routes for resource actions. Select only
  the actions the product needs. Use declarative options before hooks or custom
  persistence. Use `defineRoute` for a distinct HTTP contract.
- Keep route-owned transactions in the route. When several real production
  consumers need the same state change, place it in a focused owner-named module.
  Recheck mutable permission and state inside the transaction. Simple CRUD needs
  no forwarding module.
- Validate client input at the request boundary. Database constraints protect
  stored integrity. Server identity owns audit and ownership fields.
- Apply access predicates to the actual read or write, including list counts.
  Discover the app's supported authorization targets; no business hierarchy is
  assumed. A hidden UI control does not authorize or secure an API action.
- Return schema-bound public records and current relation display data. Batch
  derived reads. Shared storage owns object operations; the product defines
  file access and retention.
- Register each entity-owning module with its domain. Review generated migration
  SQL and use only an authorized database target.
- Test domain outcomes, access and stored effects. Use a real test database for
  constraints and transactions. Repeated framework tests and source-text checks
  do not prove module behavior.

For detailed decisions, read the skill's resource, workflow and public-record
references. Keep these rules there instead of maintaining a second code recipe.
