import { defineSectionSchema } from '../defineSectionSchema'

export default defineSectionSchema({
  code: 'content-default',
  info: {
    name: 'Content Default',
    description: 'Single content slot section',
  },
  meta: {
    fields: [
      'remove_margin',
      'remove_outline_on_images',
      'content_align',
      'url_justify',
      'layout_direction',
      'width_preset',
      'content_order',
      'button_type',
      'container_variant',
      'container_color',
      'container_custom_color',
      'container_radius',
      'container_padding',
      'column_ratio',
      'content_gap',
      'media_aspect_ratio',
      'media_radius',
      'text_color_scheme',
      'text_custom_color',
      'title_size',
      'ornament_enabled',
      'ornament_media',
      'ornament_scope',
      'ornament_position',
      'ornament_layer',
      'ornament_size',
    ] as const,
    defaultValues: {
      content_align: 'left',
      button_type: 'button',
      url_justify: 'left',
      width_preset: 'xl',
      content_order: 'image-text',
      layout_direction: 'horizontal',
      container_variant: 'plain',
      container_color: 'none',
      container_radius: 'lg',
      container_padding: 'lg',
      column_ratio: 'equal',
      content_gap: 'lg',
      media_aspect_ratio: 'auto',
      media_radius: 'lg',
      text_color_scheme: 'default',
      title_size: 'md',
      ornament_enabled: false,
      ornament_scope: 'media',
      ornament_position: 'bottom-left',
      ornament_layer: 'behind',
      ornament_size: 'md',
    },
    editor: {
      inputConfig: {
        remove_margin: { type: 'checkbox' },
        remove_outline_on_images: { type: 'checkbox' },
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
              { id: 'image-text', name: 'Media -> Teks' },
              { id: 'text-image', name: 'Teks -> Media' },
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
          props: {
            data: [
              { id: 'none', name: 'None' },
              { id: 'primary', name: 'Primary' },
              { id: 'secondary', name: 'Secondary' },
              { id: 'surface', name: 'Surface' },
              { id: 'custom', name: 'Custom' },
            ],
            clearable: false,
          },
        },
        container_custom_color: {
          type: 'text',
          dependency: {
            fields: ['container_color'],
            visibility: {
              validator: ({ container_color }: any) => container_color === 'custom',
              default: false,
            },
          },
        },
        container_radius: {
          type: 'select',
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
        container_padding: {
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
        column_ratio: {
          type: 'select',
          props: {
            data: [
              { id: 'equal', name: 'Equal' },
              { id: 'media-heavy', name: 'Media Heavy' },
              { id: 'text-heavy', name: 'Text Heavy' },
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
        media_aspect_ratio: {
          type: 'select',
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
        media_radius: {
          type: 'select',
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
        text_color_scheme: {
          type: 'select',
          props: {
            data: [
              { id: 'default', name: 'Default' },
              { id: 'on-primary', name: 'On Primary' },
              { id: 'on-secondary', name: 'On Secondary' },
              { id: 'custom', name: 'Custom' },
            ],
            clearable: false,
          },
        },
        text_custom_color: {
          type: 'text',
          dependency: {
            fields: ['text_color_scheme'],
            visibility: {
              validator: ({ text_color_scheme }: any) => text_color_scheme === 'custom',
              default: false,
            },
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
        ornament_enabled: { type: 'checkbox' },
        ornament_media: {
          type: 'image',
          dependency: {
            fields: ['ornament_enabled'],
            visibility: {
              validator: ({ ornament_enabled }: any) => Boolean(ornament_enabled),
              default: false,
            },
          },
        },
        ornament_scope: {
          type: 'select',
          dependency: {
            fields: ['ornament_enabled'],
            visibility: {
              validator: ({ ornament_enabled }: any) => Boolean(ornament_enabled),
              default: false,
            },
          },
          props: {
            data: [
              { id: 'section', name: 'Section' },
              { id: 'container', name: 'Container' },
              { id: 'media', name: 'Media' },
            ],
            clearable: false,
          },
        },
        ornament_position: {
          type: 'select',
          dependency: {
            fields: ['ornament_enabled'],
            visibility: {
              validator: ({ ornament_enabled }: any) => Boolean(ornament_enabled),
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
              validator: ({ ornament_enabled }: any) => Boolean(ornament_enabled),
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
        ornament_size: {
          type: 'select',
          dependency: {
            fields: ['ornament_enabled'],
            visibility: {
              validator: ({ ornament_enabled }: any) => Boolean(ornament_enabled),
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
        url_justify: 'Justify URL',
        layout_direction: 'Arah Layout',
        width_preset: 'Lebar Konten',
        content_order: 'Urutan Konten',
        button_type: 'Tipe Tombol',
        container_variant: 'Tipe Container',
        container_color: 'Warna Container',
        container_custom_color: 'Warna Custom Container',
        container_radius: 'Radius Container',
        container_padding: 'Padding Container',
        column_ratio: 'Rasio Kolom',
        content_gap: 'Jarak Konten',
        media_aspect_ratio: 'Rasio Media',
        media_radius: 'Radius Media',
        text_color_scheme: 'Warna Teks',
        text_custom_color: 'Warna Custom Teks',
        title_size: 'Ukuran Judul',
        ornament_enabled: 'Aktifkan Ornamen',
        ornament_media: 'File Ornamen',
        ornament_scope: 'Area Ornamen',
        ornament_position: 'Posisi Ornamen',
        ornament_layer: 'Layer Ornamen',
        ornament_size: 'Ukuran Ornamen',
      },
    },
  },
  data: {
    content: {
      type: 'content',
      order: 1,
      fields: ['media_type', 'media', 'attachment', 'subtitle', 'title', 'description', 'url', 'url_text'] as const,
      editor: {
        label: 'Main Content',
        inputConfig: {
          media_type: {
            type: 'radio',
            props: {
              defaultValue: 'image',
              data: [
                { name: 'Foto', id: 'image' },
                { name: 'Embed', id: 'embed' },
              ],
            },
          },
          media: {
            type: 'image',
            dependency: {
              fields: ['media_type'],
              inputConfig: {
                generator: ({ media_type }: any) => ({ type: media_type === 'embed' ? 'embed' : 'image' }),
                default: { type: 'image' },
              },
            },
          },
          title: { type: 'text' },
          subtitle: { type: 'text' },
          description: { type: 'rich-text' },
          url: { type: 'menu-item' },
        },
      },
    },
  },
})
