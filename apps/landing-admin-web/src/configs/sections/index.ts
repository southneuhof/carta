import contentDefault from './content-default'
import contentGallery from './content-gallery'
import dataList from './data-list'
import heroBanner from './hero-banner'
import heroBannerTwo from './hero-banner-two'

export const sectionEditorOverlays = [
  contentDefault,
  contentGallery,
  dataList,
  heroBanner,
  heroBannerTwo,
] as const

export * from './types'
