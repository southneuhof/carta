# Bounded generator path

Use for one resource with standard CRUD, known fields, permissions, routes,
navigation, optional seed data, and no relation consumer, workflow, custom
write, custom surface, risky migration, or open decision.

## Manifest

Write `plans/<feature>/module.json` after the design gate. The generic token is
`kind: "bounded-module"`. `navigation.group` selects any existing authenticated
route and navigation group; the generator does not assign a business group.

```json
{
  "kind": "bounded-module",
  "slug": "service-levels",
  "table": "service_levels",
  "symbol": "ServiceLevel",
  "title": "Service Levels",
  "identity": { "key": "id", "type": "text", "primary": true, "generated": "uuid" },
  "fields": [
    { "key": "name", "type": "text", "label": "Name", "required": true, "renderer": "text" },
    { "key": "active", "type": "boolean", "label": "Active", "required": true, "renderer": "checkbox", "default": true }
  ],
  "labels": {
    "listTitle": "Service Levels",
    "detailTitle": "Service Level",
    "createTitle": "Create Service Level",
    "editTitle": "Edit Service Level",
    "submitLabel": "Save"
  },
  "permissions": {
    "moduleName": "Service Levels",
    "realm": "system",
    "entries": {
      "list": { "name": "List service levels", "description": "List service levels." },
      "detail": { "name": "View service level", "description": "View a service level." },
      "create": { "name": "Create service level", "description": "Create a service level." },
      "update": { "name": "Update service level", "description": "Update a service level." },
      "delete": { "name": "Delete service level", "description": "Delete a service level." }
    }
  },
  "navigation": {
    "group": "settings",
    "after": "settings-roles",
    "title": "Service Levels",
    "icon": "folder",
    "separator": "Configuration"
  }
}
```

Use `actionFields` when list, detail, create, and update have different field
sets. Add `seed` only when the design requires stable initial records.

## Pipeline

After manifest and plan approval, run:

```sh
python3 .agents/skills/carta-module-development/scripts/scaffold_bounded.py --manifest /absolute/path/module.json --json
```

The wrapper runs scaffold, dry integration, applied integration, development
migration and seed, static verification, and focused verification. It stops on
the first failure. Its development database writes must be inside the approved
plan.

The generator writes the API entity, model, route test, web schema, resource,
standard route surfaces, and focused tests. Integration registers the API
module, Carta permission codes, optional seed, and the selected navigation
group. `verify:module` checks the generated and integrated result.

Escalate to the complex path when evidence reveals a relation, child,
workflow, custom action, custom surface, or new material decision.
