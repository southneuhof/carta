import { Suspense, createApp, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PathTree from '../_layouts/PathTree.vue'
import { configureFrameworkBehaviors, resetFrameworkBehaviorsForTests } from '@southneuhof/is-vue-framework/adapters/behaviors'

const mounted: Array<ReturnType<typeof createApp>> = []

const treeFixtures: Record<string, Array<Record<string, any>>> = {
  '/storage/public': [
    {
      path: '/storage/public/level-1',
      type: 'folder',
      updated_at: '2026-01-01T08:00:00.000Z',
    },
  ],
  '/storage/public/level-1': [
    {
      path: '/storage/public/level-1/child-1',
      type: 'folder',
      updated_at: '2026-01-01T07:00:00.000Z',
    },
  ],
  '/storage/public/level-1/child-1': [],
}

async function flush() {
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

function mountPathTree() {
  const host = document.createElement('div')
  document.body.append(host)

  const modelRef = ref<Record<string, any>>({ path: '/storage/public' })

  const app = createApp({
    setup() {
      return () =>
        h(Suspense, null, {
          default: () =>
            h(PathTree, {
              item: { path: '/storage/public' },
              level: 0,
              modelValue: modelRef.value,
              'onUpdate:modelValue': (value: any) => {
                modelRef.value = value
              },
            }),
          fallback: () => h('div', 'loading'),
        })
    },
  })

  mounted.push(app)
  app.mount(host)

  return {
    host,
    getModel: () => modelRef.value,
  }
}

beforeEach(() => {
  resetFrameworkBehaviorsForTests()
  configureFrameworkBehaviors({
    fileManager: {
      listFiles: vi.fn().mockImplementation(({ dir, type }: { dir: string; type?: string }) => {
        if (type === 'folder') {
          return Promise.resolve(treeFixtures[dir] || [])
        }

        return Promise.resolve([])
      }),
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

describe('PathTree selection behavior', () => {
  it('renders Storage as the visible root and keeps it selected by path', async () => {
    mountPathTree()
    await flush()

    const rootButton = Array.from(document.body.querySelectorAll('button')).find((button) => button.textContent?.includes('Storage')) as HTMLButtonElement | undefined
    expect(rootButton).toBeTruthy()
    expect(rootButton?.className).toContain('bg-info-container')
  })

  it('renders child folders nested under Storage instead of at the same indentation level', async () => {
    mountPathTree()
    await flush()

    const rootButton = Array.from(document.body.querySelectorAll('button')).find((button) => button.textContent?.includes('Storage')) as HTMLButtonElement | undefined
    const childButton = Array.from(document.body.querySelectorAll('button')).find((button) => button.textContent?.includes('level-1')) as HTMLButtonElement | undefined

    expect(rootButton).toBeTruthy()
    expect(childButton).toBeTruthy()
    expect(rootButton?.style.paddingLeft).toBe('8px')
    expect(childButton?.style.paddingLeft).toBe('24px')
  })

  it('allows the Storage root to collapse and expand', async () => {
    mountPathTree()
    await flush()

    const rootButton = Array.from(document.body.querySelectorAll('button')).find((button) => button.textContent?.includes('Storage')) as HTMLButtonElement | undefined
    const toggle = rootButton?.querySelector('.group\\/expandIcon') as HTMLDivElement | null
    expect(rootButton).toBeTruthy()
    expect(toggle).toBeTruthy()
    expect(document.body.textContent || '').toContain('level-1')

    toggle?.click()
    await flush()
    expect(document.body.textContent || '').not.toContain('level-1')

    toggle?.click()
    await flush()
    expect(document.body.textContent || '').toContain('level-1')
  })

  it('selects folders using a copied active-path object and keeps highlight by path', async () => {
    const { getModel } = mountPathTree()
    await flush()

    const folderButton = Array.from(document.body.querySelectorAll('button')).find((button) => button.textContent?.includes('level-1')) as HTMLButtonElement | undefined
    expect(folderButton).toBeTruthy()

    folderButton?.click()
    await flush()

    const selectedModel = getModel()
    expect(selectedModel).not.toBe(treeFixtures['/storage/public'][0])
    expect(selectedModel.path).toBe('/storage/public/level-1')
    expect(folderButton?.className).toContain('bg-info-container')
  })

  it('hydrates expanded non-root nodes on mount so their children remain visible after remount', async () => {
    const host = document.createElement('div')
    document.body.append(host)

    const modelRef = ref<Record<string, any>>({ path: '/storage/public/level-1/child-1' })

    const app = createApp({
      setup() {
        return () =>
          h(Suspense, null, {
            default: () =>
              h(PathTree, {
                item: { path: '/storage/public/level-1', type: 'folder' },
                level: 1,
                modelValue: modelRef.value,
                expandedPaths: ['/storage/public', '/storage/public/level-1'],
                onExpandedChange: vi.fn(),
                onDirectoryDeleted: vi.fn(),
                'onUpdate:modelValue': (value: any) => {
                  modelRef.value = value
                },
              }),
            fallback: () => h('div', 'loading'),
          })
      },
    })

    mounted.push(app)
    app.mount(host)
    await flush()

    expect(document.body.textContent || '').toContain('child-1')
  })
})
