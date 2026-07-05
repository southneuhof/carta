import { useIsApiClient } from './services'

const api = useIsApiClient()
api.products.create.$post({
  json: { name: 1 },
})
