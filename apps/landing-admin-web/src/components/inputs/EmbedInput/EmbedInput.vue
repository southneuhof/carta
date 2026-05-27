<script setup lang="ts">
import { computed } from 'vue'

const modelValue = defineModel<string | undefined>()

defineProps<{
  disabled?: boolean
  placeholder?: string
  required?: boolean
}>()

const allowedHosts = new Set<string>([
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'player.vimeo.com',
  'vimeo.com',
  'www.google.com',
  'maps.google.com',
])

type EmbedValidation = {
  isEmpty: boolean
  isValid: boolean
  safePreviewSrc?: string
  host?: string
  message: string
}

const validation = computed<EmbedValidation>(() => {
  const rawValue = modelValue.value ?? ''
  const trimmedValue = rawValue.trim()

  if (!trimmedValue) {
    return {
      isEmpty: true,
      isValid: false,
      message: 'Paste iframe embed code to preview it safely.',
    }
  }

  const doc = new DOMParser().parseFromString(trimmedValue, 'text/html')
  const body = doc.body
  const iframeElements = body.querySelectorAll('iframe')

  if (body.querySelector('script, style')) {
    return {
      isEmpty: false,
      isValid: false,
      message: 'Embed code cannot contain script or style tags.',
    }
  }

  if (iframeElements.length !== 1) {
    return {
      isEmpty: false,
      isValid: false,
      message: 'Embed must contain exactly one iframe element.',
    }
  }

  const hasUnexpectedContent = Array.from(body.childNodes).some((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim().length
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      return (node as Element).tagName.toLowerCase() !== 'iframe'
    }

    return true
  })

  if (hasUnexpectedContent) {
    return {
      isEmpty: false,
      isValid: false,
      message: 'Embed must only contain a single iframe and optional whitespace.',
    }
  }

  const iframe = iframeElements[0]
  const srcValue = iframe.getAttribute('src')?.trim()
  if (!srcValue) {
    return {
      isEmpty: false,
      isValid: false,
      message: 'Iframe src is required.',
    }
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(srcValue)
  } catch {
    return {
      isEmpty: false,
      isValid: false,
      message: 'Iframe src must be a valid absolute URL.',
    }
  }

  if (parsedUrl.protocol !== 'https:') {
    return {
      isEmpty: false,
      isValid: false,
      message: 'Iframe src must use HTTPS.',
    }
  }

  const host = parsedUrl.hostname.toLowerCase()
  if (!allowedHosts.has(host)) {
    return {
      isEmpty: false,
      isValid: false,
      message: `Host "${host}" is not allowed for preview.`,
    }
  }

  return {
    isEmpty: false,
    isValid: true,
    safePreviewSrc: parsedUrl.toString(),
    host,
    message: 'Embed code is valid!',
  }
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <textarea
      v-model="modelValue"
      :disabled="disabled"
      :required="required"
      :placeholder="placeholder"
      class="min-h-[120px] w-full rounded-lg border border-outline bg-surface px-3 py-2"
    />

    <div class="rounded-md border px-3 py-2 text-sm" :class="validation.isValid ? 'border-success/40 bg-success/5 text-success' : validation.isEmpty ? 'border-outline-variant bg-surface-container-low text-muted' : 'border-warning/40 bg-warning/5 text-warning'">
      {{ validation.message }}
    </div>

    <div v-if="validation.isValid && validation.safePreviewSrc" class="flex flex-col gap-2">
      <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span class="rounded-full border border-outline-variant px-2 py-1">Source: {{ validation.host }}</span>
        <a :href="validation.safePreviewSrc" target="_blank" rel="noopener noreferrer" class="underline">
          Open source in new tab
        </a>
      </div>
      <div class="embed-preview-frame overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
        <iframe
          :src="validation.safePreviewSrc"
          title="Embed preview"
          class="h-full w-full"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.embed-preview-frame {
  aspect-ratio: 16 / 9;
  min-height: 220px;
}
</style>
