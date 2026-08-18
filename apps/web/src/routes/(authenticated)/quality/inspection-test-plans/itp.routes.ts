export function projectItpRoute(record: Record<string, unknown>) {
  return { name: 'quality-inspection-test-plans-detail' as const, params: { projectId: String(record.id) } }
}
