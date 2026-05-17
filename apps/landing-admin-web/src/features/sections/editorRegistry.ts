import DataListGalleryEditor from '@/views/authenticated/website/website/_layouts/detail/_layouts/_layouts/_layouts/_Custom/DataListGalleryEditor.vue'
import ContentGalleryGalleryEditor from '@/views/authenticated/website/website/_layouts/detail/_layouts/_layouts/_layouts/_Custom/ContentGalleryGalleryEditor.vue'

export const sectionSlotEditorRegistry = {
  'hero-banner.projectCategory': ContentGalleryGalleryEditor,
  'data-list.childSections': DataListGalleryEditor,
} as const

export function resolveSectionSlotEditor(key?: string) {
  return key ? sectionSlotEditorRegistry[key as keyof typeof sectionSlotEditorRegistry] : undefined
}
