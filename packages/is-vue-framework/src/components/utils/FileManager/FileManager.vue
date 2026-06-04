<script setup lang="ts">
import { ref, watch, type PropType } from 'vue'
import PathTree from './_layouts/PathTree.vue'
import PathDetail from './_layouts/PathDetail.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

const props = defineProps({
  multi: {
    type: Boolean,
    default: false,
  },
  pick: {
    type: Array as PropType<('file' | 'folder')[]>,
    default: () => ['file', 'folder'],
  },
  onSelectFile: {
    type: Function,
    default: () => {},
  },
  activePath: {
    type: String,
    default: () => '',
  },
  activeObject: {
    type: Object,
    default: () => null,
  },
})

const DEFAULT_ACCESSIBLE_PATH = '/storage/public'

function resolveActivePath(path?: string) {
  return path && path.trim() ? path : DEFAULT_ACCESSIBLE_PATH
}

function getParentPath(path?: string) {
  const normalizedPath = resolveActivePath(path)
  const segments = normalizedPath.split('/').filter(Boolean)

  if (segments.length <= 2) {
    return DEFAULT_ACCESSIBLE_PATH
  }

  return `/${segments.slice(0, -1).join('/')}`
}

async function getSiblingDirectoryPath(path?: string) {
  const parentPath = getParentPath(path)
  const behavior = getFrameworkBehaviors().fileManager?.listFiles
  if (!behavior) missingBehavior('fileManager.listFiles')

  const responseData = (await behavior({ dir: parentPath, type: 'folder' })) || []
  const siblingDirectories = responseData.filter((item: Record<string, any>) => item?.path && item.path !== path)

  return siblingDirectories[0]?.path || null
}

const activePath = ref<any>({ path: resolveActivePath(props.activePath) })
const treeRenderKey = ref(0)
const pathHistory = ref<string[]>([resolveActivePath(props.activePath)])
const pathHistoryIndex = ref(0)
const isNavigatingHistory = ref(false)
const expandedPaths = ref<string[]>([DEFAULT_ACCESSIBLE_PATH])

watch(
  () => props.activePath,
  () => {
    const resolvedPath = resolveActivePath(props.activePath)
    activePath.value = { ...activePath.value, path: resolvedPath }
    pathHistory.value = [resolvedPath]
    pathHistoryIndex.value = 0
    isNavigatingHistory.value = false
    expandedPaths.value = [DEFAULT_ACCESSIBLE_PATH]
  }
)

watch(
  () => activePath.value?.path,
  (nextPath) => {
    const resolvedPath = resolveActivePath(nextPath)

    if (isNavigatingHistory.value) {
      isNavigatingHistory.value = false
      return
    }

    if (pathHistory.value[pathHistoryIndex.value] === resolvedPath) {
      return
    }

    pathHistory.value = [...pathHistory.value.slice(0, pathHistoryIndex.value + 1), resolvedPath]
    pathHistoryIndex.value = pathHistory.value.length - 1
  }
)

async function handleDirectoryDeleted(deletedPath: string) {
  const currentPath = resolveActivePath(activePath.value?.path)
  expandedPaths.value = expandedPaths.value.filter((path) => path !== deletedPath)

  if (currentPath === deletedPath || currentPath.startsWith(`${deletedPath}/`)) {
    const siblingDirectoryPath = await getSiblingDirectoryPath(deletedPath)

    activePath.value = {
      ...activePath.value,
      path: siblingDirectoryPath || getParentPath(deletedPath),
    }
  }

  treeRenderKey.value += 1
}

function handleExpandedChange(path: string, isExpanded: boolean) {
  if (isExpanded) {
    expandedPaths.value = expandedPaths.value.includes(path) ? expandedPaths.value : [...expandedPaths.value, path]
    return
  }

  if (path === DEFAULT_ACCESSIBLE_PATH) {
    expandedPaths.value = expandedPaths.value.includes(path) ? expandedPaths.value : [...expandedPaths.value, path]
    return
  }

  expandedPaths.value = expandedPaths.value.filter((expandedPath) => expandedPath !== path)
}

function navigateHistory(direction: -1 | 1) {
  const nextIndex = pathHistoryIndex.value + direction

  if (nextIndex < 0 || nextIndex >= pathHistory.value.length) {
    return
  }

  isNavigatingHistory.value = true
  pathHistoryIndex.value = nextIndex
  activePath.value = {
    ...activePath.value,
    path: pathHistory.value[nextIndex],
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <Suspense :timeout="0">
      <template #fallback>
        <div class="flex h-full items-center justify-center">
          <Spinner />
        </div>
      </template>
      <div class="grid h-full grid-cols-6 overflow-hidden rounded-lg outline outline-1 outline-outline/[24%]">
        <div class="group/pathTree col-span-1 flex flex-col overflow-hidden rounded-l-lg border border-r border-r-outline/[24%] bg-surface-container">
          <div class="flex-1 overflow-y-auto px-2 py-4">
            <PathTree
              :key="treeRenderKey"
              :item="{ path: DEFAULT_ACCESSIBLE_PATH }"
              v-model="activePath"
              :onDirectoryDeleted="handleDirectoryDeleted"
              :expandedPaths="expandedPaths"
              :onExpandedChange="handleExpandedChange"
            />
          </div>
        </div>

        <div class="col-span-5 flex flex-col overflow-hidden rounded-r-lg bg-surface-container">
          <Suspense :timeout="0">
            <template #fallback>
              <div class="flex items-center justify-center pt-8">
                <Spinner />
              </div>
            </template>
            <PathDetail
              v-if="activePath?.path"
              :activeObject="activeObject"
              v-model="activePath"
              :item="activePath"
              :onSelectFile="onSelectFile"
              :onDirectoryDeleted="handleDirectoryDeleted"
              :canNavigateBack="pathHistoryIndex > 0"
              :canNavigateForward="pathHistoryIndex < pathHistory.length - 1"
              :onNavigateBack="() => navigateHistory(-1)"
              :onNavigateForward="() => navigateHistory(1)"
              :key="JSON.stringify(activePath)"
            >
              <template v-if="$slots['footer']" #footer="{ data }">
                <slot name="footer" v-bind="{ data }" />
              </template>
            </PathDetail>
          </Suspense>
        </div>
      </div>
    </Suspense>
  </div>
</template>
