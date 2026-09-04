/** Ordered child routes rendered as record-page tabs. */
export interface RouteTab {
  action: { permission: string | null; to?: { name: string } }
  label: string
}
