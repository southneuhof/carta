import type { Plugin } from 'vue'
import { configureFrameworkBehaviors, type FrameworkBehaviors } from './behaviors'
import { applyFrameworkConfig, applyFrameworkDefaults, type FrameworkAppConfigDefaults, type FrameworkDefaultsInput } from './defaults'
import { registerInputComponents, type FrameworkInputRegistry } from '../components/composites/formInputRegistry'

export interface FrameworkPluginOptions {
  extension?: {
    inputs?: FrameworkInputRegistry
  }
  config?: FrameworkAppConfigDefaults
  defaults?: FrameworkDefaultsInput
  behaviors?: FrameworkBehaviors
}

export function createFrameworkPlugin(options: FrameworkPluginOptions = {}): Plugin {
  return {
    install() {
      if (options.extension?.inputs) registerInputComponents(options.extension.inputs)
      if (options.config) applyFrameworkConfig(options.config)
      if (options.defaults) applyFrameworkDefaults(options.defaults)
      if (options.behaviors) configureFrameworkBehaviors(options.behaviors)
    },
  }
}
