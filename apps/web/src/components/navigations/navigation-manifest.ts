// Navigation-only metadata. Route paths, components, layouts, and route meta belong to src/routes.
const navigationManifest: Modules = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'home',
    description: 'Dashboard',
    routes: [{ name: 'dashboard', title: 'Dashboard', icon: 'home' }],
  },
  {
    name: 'settings',
    title: 'Pengaturan',
    icon: 'settings',
    description: 'Pengaturan',
    routes: [
      { separator: true, name: 'System' },
      { name: 'users', title: 'Users', icon: 'folder' },
      { name: 'roles', title: 'Roles', icon: 'folder' },
    ],
  },
]

export default navigationManifest
