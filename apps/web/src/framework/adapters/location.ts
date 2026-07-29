import services from '@/utils/services'

import type { LocationOperations } from '@southneuhof/is-vue-framework'

export const locationOperations: LocationOperations = {
async detail({ id, signal }) {
  const { result } = await services.get('google-map/detail-place', { place_id: id, fields: ['geometry', 'formatted_address'] }, { init: { signal } })
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formatted_address: result.formatted_address,
  }
},

async autocomplete({ input, signal }) {
  const { predictions } = await services.get('google-map/place-autocomplete', { input }, { init: { signal } })
  return predictions.map((prediction: any) => ({
    id: String(prediction.place_id),
    primaryText: String(prediction.structured_formatting?.main_text ?? prediction.description ?? ''),
    secondaryText: prediction.structured_formatting?.secondary_text,
  }))
},

async mapConfig({ signal }) {
  const { data } = await services.get('configs', undefined, { init: { signal } })
  return { apiKey: data.gmaps.web }
},
}
