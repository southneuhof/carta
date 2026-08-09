import ListView from '../ListView.vue'
import type { ListCapableResource, TableSurfaceArguments } from '../../../resources/defineResource'

type Role = { id: string; name: string }
type RoleQuery = { state?: 'active' | 'archived' }

const roles: ListCapableResource<Role, RoleQuery> = {
  table: (_args?: TableSurfaceArguments<RoleQuery>) => ({
    table: { fields: { name: { label: 'Name' } } },
    createRoute: undefined,
    detailRoute: undefined,
    updateRoute: undefined,
    canDelete: undefined,
    deleteRecord: undefined,
  }),
}

ListView({
  resource: roles,
  tableOptions: { query: { state: 'active' } },
  filters: { fields: { state: { label: 'State' } } },
})
