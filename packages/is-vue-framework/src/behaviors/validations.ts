export type ValidationContext = {
  field: string
  formData: Record<string, any>
  inputConfig: any
}

export const REQUIRED_MESSAGE = 'Harus diisi!'
export const INVALID_MESSAGE = 'Data tidak valid!'

export function isEmptyValue(value: any) {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function executeValidationRules(value: any, ctx: ValidationContext, validation?: any): string {
  if (ctx.inputConfig?.props?.required && isEmptyValue(value)) return REQUIRED_MESSAGE
  if (isEmptyValue(value)) return ''
  if (!validation?.safeParse) return ''
  const result = validation.safeParse(value)
  if (result.success) return ''
  return result.error?.issues?.[0]?.message || INVALID_MESSAGE
}

export function hasRequiredValidation(inputConfig?: any | null) {
  return Boolean(inputConfig?.props?.required)
}
