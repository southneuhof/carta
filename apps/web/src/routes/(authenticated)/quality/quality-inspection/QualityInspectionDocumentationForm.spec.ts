import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@southneuhof/is-vue-framework', () => ({
  Form: {
    name: 'Form',
    props: ['modelValue', 'fields', 'submit'],
    data: () => ({ names: ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'] }),
    template:
      '<div data-testid="form"><div v-for="name in names" :key="name"><span>{{ modelValue[name] }}</span><span>{{ modelValue[name + \'Description\'] }}</span></div><slot name="actions" :submit="submit" :submitting="false" /></div>',
  },
}))

vi.mock('@southneuhof/is-vue-framework/components/base', () => ({
  Button: { template: '<button><slot /></button>' },
  Card: { template: '<section><slot /></section>' },
  ImagePreview: { props: ['imageURL'], template: '<img data-testid="image-preview" :src="imageURL" />' },
}))

const DocumentationForm = (await import('./QualityInspectionDocumentationForm.vue')).default

describe('Quality Inspection documentation form', () => {
  it('prefills all four retained files and notes', () => {
    const wrapper = mount(DocumentationForm, {
      props: {
        initial: {
          'sudut 1': 'uploads/one.jpg',
          'sudut 1Description': 'Catatan satu',
          'sudut 2': 'uploads/two.jpg',
          'sudut 2Description': 'Catatan dua',
          'sudut 3': 'uploads/three.jpg',
          'sudut 3Description': 'Catatan tiga',
          'sudut 4': 'uploads/four.jpg',
          'sudut 4Description': 'Catatan empat',
        },
        submit: vi.fn(),
        submitLabel: 'Submit Inspection Data',
      },
    })

    expect(wrapper.findAll('[data-testid="image-preview"]')).toHaveLength(4)
    const imageSources = wrapper.findAll('[data-testid="image-preview"]').map((image) => image.attributes('src') ?? '')
    expect(imageSources[0]).toContain('uploads%2Fone.jpg')
    expect(imageSources[1]).toContain('uploads%2Ftwo.jpg')
    expect(imageSources[2]).toContain('uploads%2Fthree.jpg')
    expect(imageSources[3]).toContain('uploads%2Ffour.jpg')
    expect(wrapper.text()).toContain('Catatan satu')
    expect(wrapper.text()).toContain('Catatan dua')
    expect(wrapper.text()).toContain('Catatan tiga')
    expect(wrapper.text()).toContain('Catatan empat')
  })
})
