// Uses name as permission if permission field is not defined
// permission is only read on route-level
const menu: Modules = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'home',
    description: 'Dashboard',
    routes: [
      {
        name: 'dashboard',
        title: 'Dashboard',
        icon: 'home',
      },
    ],
  },
  {
    name: 'settings',
    title: 'Pengaturan',
    icon: 'settings',
    description: 'Pengaturan',
    routes: [
      { separator: true, name: 'System' },
      {
        name: 'users',
        title: 'Users',
        icon: 'folder',
      },
      {
        name: 'roles',
        title: 'Roles',
        icon: 'folder',
      },
    ],
  },
]

export default menu
