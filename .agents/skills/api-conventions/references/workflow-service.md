# Workflow services

Use a service function when a business operation owns several writes, a state
transition, or a transaction shared with another module. Keep simple factory
configuration in the model. Avoid a service that only forwards unchanged args.

## Transaction boundary

A route resolves identity, validates transport input, and calls the operation.
Keep canonical HTTP contracts on factory `run`; use custom routes for distinct
actions. Import `Db`, `Tx`, or `DbOrTx` from `src/db.ts` as needed. A function
called inside a transaction uses the supplied `tx`, not a fresh `getDb()`.

For a transition:

1. Establish the caller and static permission before business writes.
2. Start one transaction. Load and lock the live parent with
   `lockRow(tx, table, id)`. Check record access before reporting its state.
3. Check record-dependent permission, then transition state, against the locked
   record. Return 404 for an inaccessible record before a state conflict can
   reveal it. A pre-transaction access read is not sufficient when ownership can
   change. Use `lockRow`'s `require` option only when access is already secured;
   it raises 409 `invalid_transition` before returning the row. Validate child
   membership and mutable related-record requirements in this transaction.
4. Write parent, children, and required database history together. Stamp custom
   writes and child audit fields explicitly; the constructor does not stamp
   arbitrary service writes.
5. Return the required record. Read transaction-consistent data before commit
   when the response must describe exactly this write. A post-commit read can
   include another caller's later change; use it only when that is acceptable.

Lock children when their state is independently mutable. Use a consistent lock
order for operations that lock several rows. Use database constraints for
uniqueness under concurrent writes; a prior existence query is not a guarantee.

Pass the same transaction into an existing cross-module operation. Add a
transaction-taking function only when a caller needs that composition. Avoid
nested independent transactions and layers of one-call forwarding functions.

## State and children

- Put transition rules at the write boundary. An `allowedOperations` response
  helps the UI; it never authorizes the next request. Recheck permission and
  state when the user acts.
- Keep old state checks out of routes when the locked service already owns them.
  Use field validation errors for input errors, 404 for missing/inaccessible
  records, and conflict errors for competing or invalid state changes.
- For child edits, validate the child's parent and ownership. Define whether an
  omitted collection means unchanged and an empty collection means clear.
- Replace a child collection only when child identity and history are disposable.
  Otherwise update by stable IDs, insert additions, and delete explicit removals.
- Snapshot related data only when later source edits must not change the record's
  meaning. Persist the required snapshot, not a second copy of every relation.
- Repeated actions need an explicit outcome: reject, return the existing result,
  or apply once. Use a unique key or locked state for apply-once behavior. Add a
  queue or outbox only when required delivery or retries justify it.

Database rollback does not reverse an object upload, email, or other remote
write. Keep remote work outside the lock where possible and define failure
handling for the required effect. Do not mark an action successful before a
required effect is secured.

## Proof

For a changed transition, test its valid source state and a rejected state;
assert parent, child, and history effects. Force a child failure to prove rollback
when atomicity is the new behavior. Test a foreign child's ID to prove membership
checks. Use two real concurrent transactions when correctness depends on a lock
or uniqueness race; sleeps do not prove ordering. Keep these checks focused on
rules the module owns.
