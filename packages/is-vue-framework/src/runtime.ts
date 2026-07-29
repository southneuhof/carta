import type { InjectionKey } from 'vue'

export interface FrameworkTableRuntime { getData?: (getAPI: string, searchParameters?: Record<string, any>) => Promise<{ data: Record<string, any>[]; totalPage?: number; total?: number }>; fieldTypes?: Record<string, any> }
export interface FrameworkDetailRuntime { getData?: (getAPI: string, searchParameters?: Record<string, any>, dataID?: string | number) => Promise<Record<string, any>>; fieldTypes?: Record<string, any> }

export interface FrameworkRuntime {
  table?: FrameworkTableRuntime
  detail?: FrameworkDetailRuntime
}

export function missingRuntimeCapability(name: string): never {
  throw new Error(`[vue-framework] Missing runtime capability: ${name}. Register it with FrameworkPlugin.`)
}

export const frameworkRuntimeKey: InjectionKey<FrameworkRuntime> = Symbol.for('is-vue-framework-runtime')
