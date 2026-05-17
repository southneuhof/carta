import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const companyProfileModel: ModelConfig = withModelDefaults({
  name: 'companyProfile',
  title: 'Company Profile',
  modelAPI: 'companyProfile',
  actions: {
    create: false,
    delete: false,
  },
  view: {
    detail: {
      dataID: '1',
    },
  },
  transaction: {
    update: {
      dataID: '1',
      fields: ['name', 'slogan', 'address', 'email', 'phone', 'facebook', 'instagram', 'twitter', 'youtube', 'whatsapp', 'linkedin', 'logo', 'subsidiaries'],
    },
    fields: ['name', 'slogan', 'address', 'email', 'phone', 'facebook', 'instagram', 'twitter', 'youtube', 'whatsapp', 'linkedin', 'logo', 'subsidiaries'],
    inputConfig: {
      name: { type: 'text', props: { required: true } },
      slogan: { type: 'text' },
      address: { type: 'textarea' },
      email: { type: 'text' },
      phone: { type: 'text' },
      facebook: { type: 'text' },
      instagram: { type: 'text' },
      twitter: { type: 'text' },
      youtube: { type: 'text' },
      whatsapp: { type: 'text' },
      linkedin: { type: 'text' },
      logo: { type: 'image' },
      subsidiaries: { type: 'textarea' },
    },
  },
})

export default companyProfileModel
