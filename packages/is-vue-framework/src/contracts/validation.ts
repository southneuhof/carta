/**
 * Validation contracts.
 *
 * Zod schemas are the source of truth for validation, but core components only
 * depend on this structural contract so schemas can be RPC-derived (plan 003)
 * or hand-written without changing the components.
 */

export interface ValidationIssue {
  /** Property path; empty for whole-draft issues. */
  path: readonly (string | number)[]
  message: string
}

export type ValidationResult<TOutput> =
  | { success: true; data: TOutput }
  | { success: false; issues: ValidationIssue[] }

export interface ValidationSchema<TOutput = unknown, TInput = unknown> {
  validate: (input: TInput) => ValidationResult<TOutput>
}

/** Backend validation errors normalized by the project adapter. */
export interface SubmitError {
  message: string
  issues?: ValidationIssue[]
}
