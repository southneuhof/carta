import { defineSectionSchema } from '../defineSectionSchema'
import { containerColorOptions } from '../helpers/container-color-options'

const isPanel = ({ container_variant }: any) => container_variant === 'panel'
const isHorizontal = ({ layout_direction }: any) => layout_direction === 'horizontal'
const isImageGallery = ({ gallery_media_type }: any) => gallery_media_type === 'image'
const isIconGallery = ({ gallery_media_type }: any) => gallery_media_type === 'icon'
const isOrnamentEnabled = ({ ornament_enabled }: any) => Boolean(ornament_enabled)
const isInsideOrnament = ({ ornament_enabled, ornament_layer }: any) => Boolean(ornament_enabled) && ornament_layer === 'inside'
const isContainerBackgroundOrnament = ({ ornament_enabled, ornament_scope, ornament_layer }: any) => Boolean(ornament_enabled) && ornament_scope === 'container' && ornament_layer === 'behind'
const usesPositionedOrnamentSize = ({ ornament_enabled, ornament_scope, ornament_layer }: any) => Boolean(ornament_enabled) && (ornament_layer === 'inside' || ornament_scope !== 'container')

export default defineSectionSchema({
  code: 'content-gallery',
  info: {
    name: 'Content Gallery',
    description: 'Two-column content section with a gallery',
  },
  meta: {
    fields: [
      'layout_direction',
      'content_order',
      'width_preset',
      'content_align',
      'gallery_header_align',
      'url_justify',
      'button_type',
      'container_variant',
      'container_color',
      'container_radius',
      'container_radius_pattern',
      'container_padding',
      'column_ratio',
      'content_gap',
      'text_color_scheme',
      'title_size',
      'gallery_title_size',
      'gallery_media_type',
      'gallery_columns',
      'gallery_gap',
      'gallery_item_align',
      'gallery_icon_size',
      'gallery_media_radius',
      'gallery_media_aspect_ratio',
      'remove_outline_on_images',
      'ornament_enabled',
      'ornament_media',
      'ornament_scope',
      'ornament_layer',
      'ornament_offset',
      'ornament_size',
      'ornament_position',
      'remove_margin',
    ] as const,
    defaultValues: {
      layout_direction: 'horizontal',
      content_order: 'content-gallery',
      width_preset: 'xl',
      content_align: 'left',
      gallery_header_align: 'left',
      url_justify: 'left',
      button_type: 'button',
      container_variant: 'panel',
      container_color: 'surface-container',
      container_radius: 'xl',
      container_radius_pattern: 'diagonal',
      container_padding: 'xl',
      column_ratio: 'content-heavy',
      content_gap: 'xl',
      text_color_scheme: 'default',
      title_size: 'md',
      gallery_title_size: 'md',
      gallery_media_type: 'icon',
      gallery_columns: '3',
      gallery_gap: 'xl',
      gallery_item_align: 'left',
      gallery_icon_size: 'md',
      gallery_media_radius: 'sm',
      gallery_media_aspect_ratio: 'auto',
      remove_outline_on_images: false,
      ornament_enabled: false,
      ornament_scope: 'container',
      ornament_position: 'top-left',
      ornament_layer: 'inside',
      ornament_offset: 'md',
      ornament_size: 'md',
    },
    editor: {
      inputConfig: {
        remove_margin: { type: 'checkbox' },
        remove_outline_on_images: {
          type: 'checkbox',
          dependency: {
            fields: ['gallery_media_type'],
            visibility: {
              validator: isImageGallery,
              default: false,
            },
          },
        },
        content_align: {
          type: 'select',
          props: {
            data: [
              { id: 'left', name: 'Kiri' },
              { id: 'center', name: 'Tengah' },
              { id: 'right', name: 'Kanan' },
            ],
            clearable: false,
          },
        },
        gallery_header_align: {
          type: 'select',
          props: {
            data: [
              { id: 'left', name: 'Kiri' },
              { id: 'center', name: 'Tengah' },
              { id: 'right', name: 'Kanan' },
            ],
            clearable: false,
          },
        },
        url_justify: {
          type: 'select',
          props: {
            data: [
              { id: 'left', name: 'Kiri' },
              { id: 'center', name: 'Tengah' },
              { id: 'right', name: 'Kanan' },
            ],
            clearable: false,
          },
        },
        layout_direction: {
          type: 'select',
          props: {
            data: [
              { id: 'vertical', name: 'Vertikal' },
              { id: 'horizontal', name: 'Horizontal' },
            ],
            clearable: false,
          },
        },
        width_preset: {
          type: 'select',
          props: {
            data: [
              { id: 'sm', name: 'Small (max. width 640px)' },
              { id: 'md', name: 'Medium (max. width 768px)' },
              { id: 'lg', name: 'Large (max. width 1024px)' },
              { id: 'xl', name: 'Extra Large (max. width 1280px)' },
            ],
            clearable: false,
          },
        },
        content_order: {
          type: 'select',
          props: {
            data: [
              { id: 'content-gallery', name: 'Konten -> Galeri' },
              { id: 'gallery-content', name: 'Galeri -> Konten' },
            ],
            clearable: false,
          },
        },
        button_type: {
          type: 'select',
          props: {
            data: [
              { id: 'text', name: 'Text' },
              { id: 'button', name: 'Button' },
            ],
            clearable: false,
          },
        },
        container_variant: {
          type: 'select',
          props: {
            data: [
              { id: 'plain', name: 'Plain' },
              { id: 'panel', name: 'Panel' },
            ],
            clearable: false,
          },
        },
        container_color: {
          type: 'select',
          dependency: {
            fields: ['container_variant'],
            visibility: {
              validator: isPanel,
              default: false,
            },
          },
          props: {
            data: [...containerColorOptions],
            clearable: false,
          },
        },
        container_radius: {
          type: 'select',
          dependency: {
            fields: ['container_variant'],
            visibility: {
              validator: isPanel,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'none', name: 'None' },
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'lg', name: 'Large' },
              { id: 'xl', name: 'Extra Large' },
            ],
            clearable: false,
          },
        },
        container_radius_pattern: {
          type: 'select',
          dependency: {
            fields: ['container_variant'],
            visibility: {
              validator: isPanel,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'all', name: 'All Corners' },
              { id: 'diagonal', name: 'Diagonal Corners' },
              { id: 'top', name: 'Top Corners' },
              { id: 'bottom', name: 'Bottom Corners' },
            ],
            clearable: false,
          },
        },
        container_padding: {
          type: 'select',
          dependency: {
            fields: ['container_variant'],
            visibility: {
              validator: isPanel,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'lg', name: 'Large' },
              { id: 'xl', name: 'Extra Large' },
            ],
            clearable: false,
          },
        },
        column_ratio: {
          type: 'select',
          dependency: {
            fields: ['layout_direction'],
            visibility: {
              validator: isHorizontal,
              default: true,
            },
          },
          props: {
            data: [
              { id: 'equal', name: 'Equal' },
              { id: 'content-heavy', name: 'Content Heavy' },
              { id: 'gallery-heavy', name: 'Gallery Heavy' },
            ],
            clearable: false,
          },
        },
        content_gap: {
          type: 'select',
          props: {
            data: [
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'lg', name: 'Large' },
              { id: 'xl', name: 'Extra Large' },
            ],
            clearable: false,
          },
        },
        text_color_scheme: {
          type: 'select',
          dependency: {
            fields: ['container_variant'],
            visibility: {
              validator: isPanel,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'default', name: 'Default' },
              { id: 'on-primary', name: 'On Primary' },
              { id: 'on-secondary', name: 'On Secondary' },
            ],
            clearable: false,
          },
        },
        title_size: {
          type: 'select',
          props: {
            data: [
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'lg', name: 'Large' },
            ],
            clearable: false,
          },
        },
        gallery_title_size: {
          type: 'select',
          props: {
            data: [
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'lg', name: 'Large' },
            ],
            clearable: false,
          },
        },
        gallery_media_type: {
          type: 'radio',
          props: {
            defaultValue: 'icon',
            data: [
              { id: 'image', name: 'Foto' },
              { id: 'embed', name: 'Embed' },
              { id: 'icon', name: 'Icon' },
            ],
          },
        },
        gallery_columns: {
          type: 'select',
          props: {
            data: [
              { id: '2', name: '2 Kolom' },
              { id: '3', name: '3 Kolom' },
              { id: '4', name: '4 Kolom' },
            ],
            clearable: false,
          },
        },
        gallery_gap: {
          type: 'select',
          props: {
            data: [
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'lg', name: 'Large' },
              { id: 'xl', name: 'Extra Large' },
            ],
            clearable: false,
          },
        },
        gallery_item_align: {
          type: 'select',
          props: {
            data: [
              { id: 'left', name: 'Kiri' },
              { id: 'center', name: 'Tengah' },
              { id: 'right', name: 'Kanan' },
            ],
            clearable: false,
          },
        },
        gallery_icon_size: {
          type: 'select',
          dependency: {
            fields: ['gallery_media_type'],
            visibility: {
              validator: isIconGallery,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'lg', name: 'Large' },
            ],
            clearable: false,
          },
        },
        gallery_media_radius: {
          type: 'select',
          dependency: {
            fields: ['gallery_media_type'],
            visibility: {
              validator: isImageGallery,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'none', name: 'None' },
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'lg', name: 'Large' },
              { id: 'xl', name: 'Extra Large' },
            ],
            clearable: false,
          },
        },
        gallery_media_aspect_ratio: {
          type: 'select',
          dependency: {
            fields: ['gallery_media_type'],
            visibility: {
              validator: isImageGallery,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'auto', name: 'Auto' },
              { id: '16/9', name: '16:9' },
              { id: '4/3', name: '4:3' },
              { id: '1/1', name: '1:1' },
            ],
            clearable: false,
          },
        },
        ornament_enabled: { type: 'checkbox' },
        ornament_media: {
          type: 'image',
          dependency: {
            fields: ['ornament_enabled'],
            visibility: {
              validator: isOrnamentEnabled,
              default: false,
            },
          },
        },
        ornament_scope: {
          type: 'select',
          dependency: {
            fields: ['ornament_enabled', 'container_variant'],
            visibility: {
              validator: isOrnamentEnabled,
              default: false,
            },
            props: {
              generator: ({ container_variant }: any) => ({
                data: container_variant === 'panel'
                  ? [
                    { id: 'container', name: 'Container' },
                    { id: 'content', name: 'Content' },
                    { id: 'gallery', name: 'Gallery' },
                  ]
                  : [
                    { id: 'section', name: 'Section' },
                    { id: 'content', name: 'Content' },
                    { id: 'gallery', name: 'Gallery' },
                  ],
                clearable: false,
              }),
              default: {
                data: [
                  { id: 'section', name: 'Section' },
                  { id: 'container', name: 'Container' },
                  { id: 'content', name: 'Content' },
                  { id: 'gallery', name: 'Gallery' },
                ],
                clearable: false,
              },
            },
          },
          props: {
            data: [
              { id: 'section', name: 'Section' },
              { id: 'container', name: 'Container' },
              { id: 'content', name: 'Content' },
              { id: 'gallery', name: 'Gallery' },
            ],
            clearable: false,
          },
        },
        ornament_position: {
          type: 'select',
          dependency: {
            fields: ['ornament_enabled', 'ornament_layer'],
            visibility: {
              validator: isInsideOrnament,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'top-left', name: 'Top Left' },
              { id: 'top-right', name: 'Top Right' },
              { id: 'bottom-left', name: 'Bottom Left' },
              { id: 'bottom-right', name: 'Bottom Right' },
              { id: 'left-center', name: 'Left Center' },
              { id: 'right-center', name: 'Right Center' },
              { id: 'corners', name: 'Corners' },
            ],
            clearable: false,
          },
        },
        ornament_layer: {
          type: 'select',
          dependency: {
            fields: ['ornament_enabled'],
            visibility: {
              validator: isOrnamentEnabled,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'behind', name: 'Behind' },
              { id: 'inside', name: 'Inside' },
            ],
            clearable: false,
          },
        },
        ornament_offset: {
          type: 'select',
          dependency: {
            fields: ['ornament_enabled', 'ornament_scope', 'ornament_layer'],
            visibility: {
              validator: isContainerBackgroundOrnament,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'xl', name: 'Extra Large' },
            ],
            clearable: false,
          },
        },
        ornament_size: {
          type: 'select',
          dependency: {
            fields: ['ornament_enabled', 'ornament_scope', 'ornament_layer'],
            visibility: {
              validator: usesPositionedOrnamentSize,
              default: false,
            },
          },
          props: {
            data: [
              { id: 'sm', name: 'Small' },
              { id: 'md', name: 'Medium' },
              { id: 'lg', name: 'Large' },
              { id: 'xl', name: 'Extra Large' },
            ],
            clearable: false,
          },
        },
      },
      fieldsAlias: {
        remove_margin: 'Hilangkan margin pada konten',
        remove_outline_on_images: 'Hilangkan outline pada gambar',
        content_align: 'Align Konten',
        gallery_header_align: 'Align Header Galeri',
        url_justify: 'Justify URL',
        layout_direction: 'Arah Layout',
        width_preset: 'Lebar Konten',
        content_order: 'Urutan Konten',
        button_type: 'Tipe Tombol',
        container_variant: 'Tipe Container',
        container_color: 'Warna Container',
        container_radius: 'Radius Container',
        container_radius_pattern: 'Pola Radius Container',
        container_padding: 'Padding Container',
        column_ratio: 'Rasio Kolom',
        content_gap: 'Jarak Konten',
        text_color_scheme: 'Warna Teks',
        title_size: 'Ukuran Judul',
        gallery_title_size: 'Ukuran Judul Galeri',
        gallery_media_type: 'Tipe Media Galeri',
        gallery_columns: 'Kolom Galeri',
        gallery_gap: 'Jarak Galeri',
        gallery_item_align: 'Align Item Galeri',
        gallery_icon_size: 'Ukuran Icon Galeri',
        gallery_media_radius: 'Radius Media Galeri',
        gallery_media_aspect_ratio: 'Rasio Media Galeri',
        ornament_enabled: 'Aktifkan Ornamen',
        ornament_media: 'File Ornamen',
        ornament_scope: 'Area Ornamen',
        ornament_position: 'Posisi Ornamen',
        ornament_layer: 'Layer Ornamen',
        ornament_offset: 'Offset Ornamen Background',
        ornament_size: 'Ukuran Ornamen',
      },
    },
  },
  data: {
    content: {
      type: 'content',
      order: 1,
      fields: ['subtitle', 'title', 'description', 'url', 'url_text'] as const,
      editor: {
        label: 'Main Content',
        inputConfig: {
          title: { type: 'text' },
          subtitle: { type: 'text' },
          description: { type: 'rich-text' },
          url: { type: 'menu-item' },
        },
      },
    },
    gallery_header: {
      type: 'content',
      order: 2,
      fields: ['subtitle', 'title', 'description', 'url', 'url_text'] as const,
      editor: {
        label: 'Gallery Header',
        inputConfig: {
          title: { type: 'text' },
          subtitle: { type: 'text' },
          description: { type: 'rich-text' },
          url: { type: 'menu-item' },
        },
      },
    },
    gallery: {
      type: 'gallery',
      order: 3,
      many: true,
      fields: ['media', 'title', 'subtitle'] as const,
      editor: {
        label: 'Gallery Items',
        inputConfig: {
          media: {
            type: 'image',
            dependency: {
              fields: ['meta'],
              inputConfig: {
                generator: ({ meta }: any) => ({
                  type: meta?.gallery_media_type === 'embed'
                    ? 'embed'
                    : meta?.gallery_media_type === 'icon'
                      ? 'icon-select'
                      : 'image',
                }),
                default: { type: 'image' },
              },
            },
          },
          title: { type: 'text' },
          subtitle: { type: 'text' },
        },
      },
    },
  },
})
