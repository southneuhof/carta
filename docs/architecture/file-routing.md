# File routing

- **Status:** Authoritative
- **Scope:** `apps/web/src/routes`

File placement sets the URL and the rendered parent chain. Use ordinary
folders for new child CRUD pages. A folder adds URL segments. Its
`index.route.vue` is the default page and is replaced by sibling pages.

A route file and a matching folder make a retained parent. The parent must
render `AppRouterView` or `RouterView`:

```text
users/[userId]/detail.route.vue
users/[userId]/detail/roles/index.route.vue
users/[userId]/detail/roles/[roleId]/detail.route.vue
```

Use native dotted segments when a page must leave a rendered parent and keep
the same URL segments. The containing folder still sets higher parents:

```text
# Leave User Detail.
users/[userId]/detail.roles.[roleId].detail.route.vue

# Keep User Detail and leave Role Detail.
users/[userId]/detail/roles/[roleId]/detail.permissions.[permissionId].detail.route.vue
```

Do not keep nested and dotted forms of the same page. Generation rejects
duplicate names, duplicate paths, multiple layouts, layout collisions, and
rendered parents without an outlet. The error lists the files to correct.
An empty index child can share its parent URL. A conditional outlet is valid.

Tabs replace a bare parent with the first available child. They stay active
for deeper pages in their collection section. Page Back uses the resource
collection `backTo`. A workflow without a routed collection supplies an
explicit target. Browser Back uses browser history.

Changing a parent ID remounts that parent and its descendants. A child ID,
query, or hash change keeps unchanged higher parents mounted. File ancestry
does not grant access or prove API scope. Guards and API checks still apply.

Valid sibling workflows can stay flat. For example, orientation catalog,
syllabus, and quiz pages replace each other. File dots are only necessary
when a matching rendered parent must be left.

Verify route names, URLs, parameters, rendered parents, tabs, page Back,
browser Back, direct entry, lifecycle, and denied direct entry. Router changes
in `apps/web` are project-owned and need a separate reviewed adoption in each
application.
