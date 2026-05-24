import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createModelCreateHandler } from '@southneuhof/landing-sveltekit-framework/api';

const prisma = vi.hoisted(() => ({
  menuItem: {
    findUnique: vi.fn(),
  },
  page: {
    create: vi.fn(),
  },
}));

vi.mock('$lib/utils/prisma', () => ({
  default: prisma,
}));

const { default: pageConfig } = await import('../src/lib/app/api/models/page');

function createLocals() {
  return {
    isPrivilegedRole: true,
    user: { id: 1 },
  };
}

describe('page create model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.menuItem.findUnique.mockResolvedValue({ allowedRoles: [] });
    prisma.page.create.mockResolvedValue({
      id: 'page-id',
      menu_item_id: 'menu-item-id',
      translations: [
        { id: 'id-translation-id', language: 'id', status_code: 'DRAFT', sectionGroups: [{ id: 'id-section-group-id' }] },
        { id: 'en-translation-id', language: 'en', status_code: 'DRAFT', sectionGroups: [{ id: 'en-section-group-id' }] },
      ],
    });
  });

  it('connects the created page to the submitted menu item and returns the page', async () => {
    const response = await createModelCreateHandler({
      prisma,
      modelConfigs: {
        './page.ts': pageConfig,
      },
    })({
      request: new Request('http://localhost/api/page/create', {
        method: 'POST',
        body: JSON.stringify({ menu_item_id: 'menu-item-id' }),
      }),
      params: { model: 'page' },
      locals: createLocals(),
    } as any);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        id: 'page-id',
        menu_item_id: 'menu-item-id',
        translations: [
          { id: 'id-translation-id', language: 'id', status_code: 'DRAFT', sectionGroups: [{ id: 'id-section-group-id' }] },
          { id: 'en-translation-id', language: 'en', status_code: 'DRAFT', sectionGroups: [{ id: 'en-section-group-id' }] },
        ],
      },
    });

    expect(prisma.menuItem.findUnique).toHaveBeenCalledWith({
      where: { id: 'menu-item-id' },
      select: {
        allowedRoles: {
          select: { id: true },
        },
      },
    });
    expect(prisma.page.create).toHaveBeenCalledWith({
      data: {
        menuItem: { connect: { id: 'menu-item-id' } },
        translations: {
          create: [
            { language: 'id', status_code: 'DRAFT', sectionGroups: { create: {} } },
            { language: 'en', status_code: 'DRAFT', sectionGroups: { create: {} } },
          ],
        },
      },
      include: {
        translations: {
          include: {
            sectionGroups: {
              select: { id: true },
            },
          },
        },
      },
    });
  });
});
