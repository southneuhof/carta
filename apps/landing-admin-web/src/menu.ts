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
    name: 'website',
    permission: 'menuItem',
    title: 'Website',
    icon: 'pages',
    description: 'Website',
    routes: [
      {
        name: 'website',
        title: 'Website',
        icon: 'web',
      },
    ],
  },
  {
    name: 'article',
    title: 'Artikel',
    icon: 'article',
    description: 'Artikel',
    routes: [
      {
        name: 'articleCategory',
        title: 'Kategori Artikel',
        icon: 'folder',
      },
      {
        name: 'article',
        title: 'Artikel',
        icon: 'folder',
      },
    ],
  },
  {
    name: 'user',
    title: 'Pengguna',
    icon: 'user',
    description: 'Pengguna',
    routes: [
      {
        name: 'user',
        title: 'Pengguna',
        icon: 'folder',
      },
      {
        name: 'role',
        title: 'Role',
        icon: 'folder',
      },
      {
        name: 'roleGroup',
        title: 'Role Group',
        icon: 'folder',
      },
      {
        name: 'permission',
        title: 'Permission',
        icon: 'folder',
      },
    ],
  },
  {
    name: 'collection',
    title: 'Collection',
    icon: 'folder',
    description: 'Collection',
    routes: [
      {
        name: 'collection',
        title: 'Collection',
        icon: 'folder',
      },
    ],
  },
  {
    name: 'form',
    title: 'Form',
    icon: 'mail',
    description: 'Form',
    routes: [
      {
        name: 'formType',
        title: 'Jenis Formulir',
        icon: 'folder',
      },
      {
        name: 'formSubmission',
        title: 'Inbox',
        icon: 'folder',
      },
    ],
  },
  {
    name: 'companyProfile',
    title: 'Company Profile',
    icon: 'building-3',
    description: 'Company Profile',
    routes: [
      {
        name: 'companyProfile',
        title: 'Company Profile',
        icon: 'corporate_fare',
      },
    ],
  },
  {
    name: 'fileManager',
    title: 'File Manager',
    icon: 'folder',
    description: 'File Manager',
    routes: [
      {
        name: 'fileManager',
        title: 'File Manager',
        icon: 'corporate_fare',
      },
    ],
  },
]

export default menu
