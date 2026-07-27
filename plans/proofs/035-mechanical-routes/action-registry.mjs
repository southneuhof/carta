export const actions = new Set()
export const events = []

export function resetRegistry() {
  actions.clear()
  events.splice(0)
}

export function registerAction(name) {
  actions.add(name)
  events.push('action-registered')
}
