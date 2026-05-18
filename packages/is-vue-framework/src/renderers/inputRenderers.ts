import { getInputComponentRegistry } from './inputRegistry'

export function getInputRenderers() {
  return getInputComponentRegistry()
}

export const inputRenderers = new Proxy({} as ReturnType<typeof getInputRenderers>, {
  get(_target, property) {
    return getInputComponentRegistry()[property as string]
  },
  ownKeys() {
    return Reflect.ownKeys(getInputComponentRegistry())
  },
  getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true }
  },
})
