/** Reusable metadata shared by active resource catalogs. */
export function timestampField(label: string) {
  return {
    label,
    display: { format: 'datetime' },
    form: false,
  } as const
}
