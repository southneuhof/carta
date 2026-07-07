import { useIsApiClient } from "@southneuhof/is-vue-framework";

const api = useIsApiClient()
api.products.create.$post({
    json: {
        name: 'Test Product'
    }
})