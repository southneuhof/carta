import { beforeEach, describe, expect, it, vi } from 'vitest';

const postMock = vi.fn();

vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
  },
}));

vi.mock('@/stores/modules', () => ({
  modules: () => ({ clear: vi.fn() }),
}));

vi.mock('@/stores/colorpreference', () => ({
  useColorPreference: () => ({ value: null, set: vi.fn() }),
}));

vi.mock('@/stores/permissions', () => ({
  permissions: () => ({ clear: vi.fn() }),
}));

vi.mock('vue-sonner', () => ({
  toast: { error: vi.fn() },
}));

vi.mock('@southneuhof/utilities/storage', () => ({
  storage: {
    cookie: {
      get: vi.fn(),
      clear: vi.fn(),
    },
    localStorage: {
      clear: vi.fn(),
    },
  },
}));

vi.mock('@southneuhof/is-vue-framework/services', () => {
  class FrameworkService {
    constructor(_: any) {}
    async post(...args: any[]) {
      return postMock(...args);
    }
  }
  return { FrameworkService };
});

describe('services file upload normalization', () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it('keeps path/url from upload response object', async () => {
    postMock.mockResolvedValue({
      path: '/storage/temp/public/a.jpg',
      url: 'https://api.example.com/storage/temp/public/a.jpg',
    });

    const { default: services } = await import('../services');
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const result = await services.fileUpload(file);

    expect(result.path).toBe('/storage/temp/public/a.jpg');
    expect(result.url).toBe('https://api.example.com/storage/temp/public/a.jpg');
    expect(result.data).toBe('/storage/temp/public/a.jpg');
  });

  it('converts raw string upload response to relative path and expanded preview URL', async () => {
    postMock.mockResolvedValue('https://old-host.com/storage/temp/public/b.jpg');

    const { default: services } = await import('../services');
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' });
    const result = await services.fileUpload(file);

    expect(result.path).toBe('/storage/temp/public/b.jpg');
    expect(result.url).toContain('/storage/temp/public/b.jpg');
  });

  it('stores relative path when response only has absolute url', async () => {
    postMock.mockResolvedValue({
      url: 'https://old-host.com/storage/temp/public/c.jpg',
    });

    const { default: services } = await import('../services');
    const file = new File(['x'], 'c.jpg', { type: 'image/jpeg' });
    const result = await services.fileUpload(file);

    expect(result.path).toBe('/storage/temp/public/c.jpg');
    expect(result.data).toBe('/storage/temp/public/c.jpg');
  });
});
