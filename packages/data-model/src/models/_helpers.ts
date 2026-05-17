export const languageOptions = [
  { id: 'id', name: 'Indonesia' },
  { id: 'en', name: 'English' },
]

export const booleanOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Nonaktif' },
]

export const visibleOptions = [
  { id: true, name: 'Visible' },
  { id: false, name: 'Hidden' },
]

export const contentMediaTypeOptions = [
  { id: 'image', name: 'Image' },
  { id: 'video', name: 'Video' },
  { id: 'panorama', name: 'Panorama' },
  { id: 'embed', name: 'Embed' },
]

export const contentUrlTypeOptions = [
  { id: 'internal', name: 'Internal' },
  { id: 'external', name: 'External' },
]

export const publicationStatusOptions = [
  { id: 'DRAFT', name: 'Draft' },
  { id: 'REVIEW', name: 'Review' },
  { id: 'PUBLISHED', name: 'Published' },
]

export const statusChipOptions = {
  DRAFT: { color: 'neutral', label: 'Draft' },
  REVIEW: { color: 'warning', label: 'Review' },
  PUBLISHED: { color: 'success', label: 'Published' },
}
