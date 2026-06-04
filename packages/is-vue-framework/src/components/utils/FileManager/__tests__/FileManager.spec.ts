import { Suspense, createApp, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FileManager from '../FileManager.vue'
import { configureFrameworkBehaviors, resetFrameworkBehaviorsForTests } from '@southneuhof/is-vue-framework/adapters/behaviors'

vi.mock('../_layouts/PathTree.vue', () => ({
  default: {
    name: 'MockPathTree',
    props: ['item'],
    template: '<div data-testid="mock-path-tree">{{ item?.path }}</div>',
  },
}))

vi.mock('../_layouts/PathDetail.vue', () => ({
  default: {
    name: 'MockPathDetail',
    props: ['modelValue', 'onDirectoryDeleted'],
    template: `
      <div>
        <div data-testid="mock-path-detail">{{ modelValue?.path }}</div>
        <button data-testid="delete-current-folder" @click="onDirectoryDeleted(modelValue?.path)">Delete current folder</button>
      </div>
    `,
  },
}))

vi.mock('@southneuhof/is-vue-framework/components/base/Spinner.vue', () => ({
  default: {
    name: 'MockSpinner',
    template: '<div>loading</div>',
  },
}))

const mounted: Array<ReturnType<typeof createApp>> = []

async function flush() {
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function mountFileManager(activePath = '/storage/public/folder-b') {
  const host = document.createElement('div')
  document.body.append(host)

  const app = createApp({
    setup() {
      return () =>
        h(Suspense, null, {
          default: () =>
            h(FileManager, {
              activePath,
            }),
          fallback: () => h('div', 'loading'),
        })
    },
  })

  mounted.push(app)
  app.mount(host)

  return { host }
}

beforeEach(() => {
  resetFrameworkBehaviorsForTests()
})

afterEach(() => {
  for (const app of mounted.splice(0)) app.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('FileManager delete navigation', () => {
  it('falls back to a sibling folder before navigating to the parent', async () => {
    configureFrameworkBehaviors({
      fileManager: {
        listFiles: vi.fn().mockImplementation(({ dir }: { dir: string }) => {
          if (dir === '/storage/public') {
            return Promise.resolve([
              { path: '/storage/public/folder-a', type: 'folder' },
              { path: '/storage/public/folder-c', type: 'folder' },
            ])
          }

          return Promise.resolve([])
        }),
      },
    })

    mountFileManager()
    await flush()

    const deleteButton = document.body.querySelector('[data-testid="delete-current-folder"]') as HTMLButtonElement | null
    expect(deleteButton).toBeTruthy()

    deleteButton?.click()
    await flush()

    expect(document.body.querySelector('[data-testid="mock-path-detail"]')?.textContent).toBe('/storage/public/folder-a')
  })

  it('falls back to the parent folder when no siblings remain', async () => {
    configureFrameworkBehaviors({
      fileManager: {
        listFiles: vi.fn().mockResolvedValue([]),
      },
    })

    mountFileManager()
    await flush()

    const deleteButton = document.body.querySelector('[data-testid="delete-current-folder"]') as HTMLButtonElement | null
    expect(deleteButton).toBeTruthy()

    deleteButton?.click()
    await flush()

    expect(document.body.querySelector('[data-testid="mock-path-detail"]')?.textContent).toBe('/storage/public')
  })
})
