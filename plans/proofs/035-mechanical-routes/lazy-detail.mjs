import { events, registerAction } from './action-registry.mjs'

events.push('lazy-module-evaluated')
registerAction('settings-roles-detail')

export default { name: 'LazyDetail' }
