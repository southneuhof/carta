import { useIsApiClient } from '@southneuhof/is-vue-framework/services'

const api = useIsApiClient()
api.products.create.$post({
  json: { name: 1 },
})
