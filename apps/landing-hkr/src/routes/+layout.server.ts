import { getLocale } from '$lib/paraglide/runtime.js';
import { getLanguagePrefix } from '$lib/utils/common.js';
import prisma from '$lib/utils/prisma.js';
import { error, redirect } from '@sveltejs/kit';

function getFullSlugPath(node: any): string {
  const parts: string[] = [];

  function collect(node: any) {
    if (!node) return;
    if (node.parent) collect(node.parent);
    parts.push(node.slug);
  }

  collect(node);
  return '/' + parts.join('/');
}

export async function load({params, url, untrack}) {
  console.log('RAN MAIN LAYOUT')
  const [menu, primaryMenu, documentRequestMenu, helpCenterMenu, projectListMenu, companyProfile, collection] = await Promise.all([
    prisma.menuItem.findMany({
      where: {
        level: 1,
      },
      orderBy: {
        order: 'asc'
      },
      select: {
        menu_item_type: true,
        visible: true,
        url: true,
        slug: true,
        show_submenu_below_navbar: true,
        translations: {
          where: {
            language: getLocale(),
          },
          select: {
            id: true,
            name: true,
            description: true,  
          },
        },
        page: {
          select: {
            translations: {
              where: {
                language: getLocale(),
                status_code: 'PUBLISHED',
              },
              select: {
                id: true,
                sectionGroups: {
                  select: {
                    id: true
                  }
                }
              }
            },
          }
        },
        children: {
          orderBy: {order: 'asc'},
          select: {
            menu_item_type: true,
            visible: true,
            url: true,
            slug: true,
            show_submenu_below_navbar: true,
            translations: {
              where: {
                language: getLocale(),
              },
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            page: {
              select: {
                translations: {
                  where: {
                    language: getLocale(),
                    status_code: 'PUBLISHED',
                  },
                  select: {
                    id: true,
                    sectionGroups: {
                      select: {
                        id: true
                      }
                    }
                  }
                },
              }
            },
            children: {
              orderBy: {order: 'asc'},
              select: {
                menu_item_type: true,
                visible: true,
                url: true,
                slug: true,
                show_submenu_below_navbar: true,
                translations: {
                  where: {
                    language: getLocale(),
                  },
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
                page: {
                  select: {
                    translations: {
                      where: {
                        language: getLocale(),
                        status_code: 'PUBLISHED',
                      },
                      select: {
                        id: true,
                        sectionGroups: {
                          select: {
                            id: true
                          }
                        }
                      }
                    },
                  }
                },
              }
            }
          }
        }
      }
    }),
    prisma.menuItem.findFirst({
      where: {role: 'home'},
      select: {
        slug: true,
        parent: {
          select: {
            slug: true,
            parent: {
              select: {
                slug: true,
              }
            }
          }
        }
      }
    }),
    prisma.menuItem.findFirst({
      where: {role: 'document_request'},
      select: {
        slug: true,
        parent: {
          select: {
            slug: true,
            parent: {
              select: {
                slug: true,
              }
            }
          }
        }
      }
    }),
    prisma.menuItem.findFirst({
      where: {role: 'help_center'},
      select: {
        slug: true,
        parent: {
          select: {
            slug: true,
            parent: {
              select: {
                slug: true,
              }
            }
          }
        }
      }
    }),
    prisma.menuItem.findFirst({
      where: {role: 'project_list'},
      select: {
        slug: true,
        parent: {
          select: {
            slug: true,
            parent: {
              select: {
                slug: true,
              }
            }
          }
        }
      }
    }),
    prisma.companyProfile.findFirst({where: {id: 1}}),
    prisma.collection.findMany({})
  ])

  if (primaryMenu && untrack(() => url.pathname == '/')) {
    return redirect(308, getFullSlugPath(primaryMenu))
  }

  return {
    menu: menu
            .map((item) => ({
              ...item,
              name: item.translations[0].name,
              description: item.translations[0].description,
              page: item.page?.[0],
              children: item.children.map((item) => ({
                ...item,
                name: item.translations[0].name,
                description: item.translations[0].description,
                page: item.page?.[0],
                children: item.children.map((item) => ({
                  ...item,
                  name: item.translations[0].name,
                  description: item.translations[0].description,
                  page: item.page?.[0],
                }))
              }))
            })),
    primaryMenuPath: primaryMenu ? getFullSlugPath(primaryMenu) : '',
    documentRequestMenuPath: documentRequestMenu ? getFullSlugPath(documentRequestMenu) : '',
    helpCenterMenuPath: helpCenterMenu ? getFullSlugPath(helpCenterMenu) : '',
    projectListMenuPath: projectListMenu ? getFullSlugPath(projectListMenu) : '',
    companyProfile,
    collection
    // currentPageSectionGroup: currentPageSectionGroup
  }
}