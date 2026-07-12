import type { InjectionKey } from 'vue'
import type { FrameworkBehaviors } from './adapters/behaviors'

export interface FrameworkRuntime<TCRUDResource = unknown> {
  behaviors: FrameworkBehaviors<TCRUDResource>
}

export const frameworkRuntimeKey: InjectionKey<FrameworkRuntime> = Symbol('is-vue-framework-runtime')
