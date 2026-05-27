import { Suspense, createApp, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PathDetail from '../_layouts/PathDetail.vue'
import { configureFrameworkBehaviors, resetFrameworkBehaviorsForTests } from '@southneuhof/is-vue-framework/adapters/behaviors'

const mounted: Array<ReturnType<typeof createApp>> = []

const fixtureItems = [
  {
    path: '/storage/public/photo.jpg',
    type: 'file',
    url: 'https://example.com/photo.jpg',
    updated_at: '2026-01-01T10:00:00.000Z',
  },
  {
    path: '/storage/public/doc.txt',
    type: 'file',
    url: 'https://example.com/doc.txt',
    updated_at: '2026-01-01T09:00:00.000Z',
  },
  {
    path: '/storage/public/folder-a',
    type: 'folder',
    updated_at: '2026-01-01T08:00:00.000Z',
  },
]

function createLocalStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

async function flush() {
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

function mountPathDetail(options: { initialPath?: string; onSelectFile?: (value: any) => void } = {}) {
  const host = document.createElement('div')
  document.body.append(host)

  const onSelectFile = options.onSelectFile || vi.fn()
  const modelRef = ref({ path: options.initialPath || '/storage/public' })

  const app = createApp({
    setup() {
      return () =>
        h(Suspense, null, {
          default: () =>
            h(PathDetail, {
              item: modelRef.value,
              modelValue: modelRef.value,
              'onUpdate:modelValue': (value: any) => {
                modelRef.value = value
              },
              onSelectFile,
              activeObject: null,
            }),
          fallback: () => h('div', 'loading'),
        })
    },
  })

  app.directive('columns-resizable', {})

  mounted.push(app)
  app.mount(host)

  return {
    host,
    onSelectFile,
    getModel: () => modelRef.value,
  }
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    configurable: true,
  })
  resetFrameworkBehaviorsForTests()
  configureFrameworkBehaviors({
    fileManager: {
      listFiles: vi.fn().mockResolvedValue(fixtureItems),
      uploadFile: vi.fn(),
      createFolder: vi.fn(),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    },
  })
})

afterEach(() => {
  for (const app of mounted.splice(0)) app.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('PathDetail view mode', () => {
  it('defaults to thumbnail mode when no saved preference exists', async () => {
    mountPathDetail()
    await flush()

    expect(document.body.querySelector('[data-testid="file-thumbnail-grid"]')).toBeTruthy()
    expect(document.body.querySelector('[data-testid="file-list-table"]')).toBeFalsy()
  })

  it('reads saved mode from localStorage', async () => {
    window.localStorage.setItem('fileManager.viewMode', 'list')
    mountPathDetail()
    await flush()

    expect(document.body.querySelector('[data-testid="file-list-table"]')).toBeTruthy()
    expect(document.body.querySelector('[data-testid="file-thumbnail-grid"]')).toBeFalsy()
  })

  it('toggles mode and persists the selected value', async () => {
    mountPathDetail()
    await flush()

    const listToggle = document.body.querySelector('button[aria-label="List view"]') as HTMLButtonElement
    expect(listToggle).toBeTruthy()

    listToggle.click()
    await flush()

    expect(window.localStorage.getItem('fileManager.viewMode')).toBe('list')
    expect(document.body.querySelector('[data-testid="file-list-table"]')).toBeTruthy()
  })

  it('renders image previews and non-image fallback tiles in thumbnail mode', async () => {
    mountPathDetail()
    await flush()

    const image = document.body.querySelector('img[alt="photo.jpg"]') as HTMLImageElement | null
    expect(image).toBeTruthy()

    const textTile = document.body.querySelector('[data-testid="file-thumbnail-grid"]')?.textContent || ''
    expect(textTile).toContain('doc.txt')
  })

  it('keeps click behavior in thumbnail mode (select + folder navigation)', async () => {
    const onSelectFile = vi.fn()
    const { getModel } = mountPathDetail({ onSelectFile })
    await flush()

    const folderButton = Array.from(document.body.querySelectorAll('[data-testid="file-thumbnail-grid"] button')).find((button) => button.textContent?.includes('folder-a')) as
      | HTMLButtonElement
      | undefined
    expect(folderButton).toBeTruthy()

    folderButton?.click()
    await flush()

    expect(onSelectFile).toHaveBeenCalled()
    expect(getModel().path).toBe('/storage/public/folder-a')
  })

  it('still renders list mode table (regression)', async () => {
    window.localStorage.setItem('fileManager.viewMode', 'list')
    mountPathDetail()
    await flush()

    expect(document.body.querySelector('[data-testid="file-list-table"]')).toBeTruthy()
    expect(document.body.textContent || '').toContain('photo.jpg')
  })
})
