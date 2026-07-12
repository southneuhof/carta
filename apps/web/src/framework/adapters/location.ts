import services from '@/utils/services'

export async function getPlaceDetail(place_id: string | number) {
  const { result } = await services.get('google-map/detail-place', { place_id, fields: ['geometry', 'formatted_address'] })
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formatted_address: result.formatted_address,
  }
}

export async function getPlaceAutocomplete(input: string) {
  const { predictions } = await services.get('google-map/place-autocomplete', { input })
  return predictions
}

export async function getMapConfig() {
  const { data } = await services.get('configs')
  return { apiKey: data.gmaps.web }
}
