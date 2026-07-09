<script setup lang="ts">
import { GoogleMap, Marker } from 'vue3-google-map'
import { computed, ref, watch, type PropType } from 'vue'
import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'
import { commonProps } from '../../inputs/commonprops'
import Popover from '../../base/Popover.vue'
import SearchBox from '../SearchBox.vue'
import BaseInput from '../../inputs/BaseInput.vue'
import Form from '../Form.vue'
import config, { mode } from '@southneuhof/is-vue-framework/adapters/defaults'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import Tooltip from '@southneuhof/is-vue-framework/components/base/Tooltip.vue'

type Coordinate = {
  lat: number
  lng: number
  formatted_address?: string
}

const props = defineProps({
  ...commonProps,
  lat: {
    type: Number,
  },
  lng: {
    type: Number,
  },
  formConfig: {
    type: Object as PropType<any>,
  },
})

const modelValue = defineModel<Coordinate>()
const emit = defineEmits<{
  (event: 'validation:touch'): void
}>()

const selectedLocation = ref()
const query = ref('')
const zoom = ref(5)
const center = ref<Coordinate>(modelValue.value ? { lat: Number(modelValue.value?.lat), lng: Number(modelValue.value?.lng) } : { lat: -1.2100164677737193, lng: 117.56306695042623 })
const autocompletePredictions = ref<Record<string, any>[]>([])
const loading = ref(false)

const formModel = computed({
  get: () => modelValue.value as Coordinate,
  set: (value: Partial<Coordinate>) => {
    modelValue.value = {
      lat: Number(value?.lat ?? modelValue.value?.lat ?? center.value.lat),
      lng: Number(value?.lng ?? modelValue.value?.lng ?? center.value.lng),
      formatted_address: value?.formatted_address ?? modelValue.value?.formatted_address,
    }
  },
})

watch(modelValue, () => {
  if (modelValue.value) center.value = modelValue.value
  else center.value = { lat: -1.2100164677737193, lng: 117.56306695042623 }
})

async function getLocationDetail(place_id: any) {
  zoom.value = 5
  loading.value = true
  const getPlaceDetail = getFrameworkBehaviors().location?.getPlaceDetail
  if (!getPlaceDetail) missingBehavior('location.getPlaceDetail')
  const result = await getPlaceDetail(place_id)
  loading.value = false
  modelValue.value = {
    lat: result.lat,
    lng: result.lng,
    formatted_address: result.formatted_address,
  }
  emit('validation:touch')
}

async function getPlacesAutocomplete() {
  const getPlaceAutocomplete = getFrameworkBehaviors().location?.getPlaceAutocomplete
  if (!getPlaceAutocomplete) missingBehavior('location.getPlaceAutocomplete')
  autocompletePredictions.value = await getPlaceAutocomplete(query.value)
}

function getCurrentLocation() {
  navigator.geolocation.getCurrentPosition((position) => {
    modelValue.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }
    emit('validation:touch')
  })
}

watch(query, () => {
  if (query.value) getPlacesAutocomplete()
})

function handlePinDragEnd(event: any) {
  modelValue.value = {
    lat: event.latLng.lat(),
    lng: event.latLng.lng(),
  }
  emit('validation:touch')
}

const getMapConfig = getFrameworkBehaviors().location?.getMapConfig
if (!getMapConfig) missingBehavior('location.getMapConfig')
const { apiKey: GOOGLE_MAP_API_KEY } = await getMapConfig()
</script>

<template>
  <BaseInput v-bind="props">
    <div class="grid grid-cols-12 gap-8">
      <div class="col-span-3 flex flex-col gap-4">
        <Popover class="w-full" :ignore="['#location-search-box']" static>
          <template #trigger="{ setOpen }">
            <div class="w-full">
              <SearchBox class="w-full" v-model="query" id="location-search-box" :placeholder="'Cari lokasi...'" />
            </div>
          </template>
          <template #content>
            <Card color="surfaceContainerHigh" class="min-w-full gap-2">
              <template v-if="query">
                <template v-if="autocompletePredictions">
                  <Card
                    v-for="prediction in autocompletePredictions"
                    :color="prediction.place_id === selectedLocation?.place_id ? 'primaryContainer' : 'surfaceContainerHigh'"
                    @click=";[getLocationDetail(prediction.place_id), (selectedLocation = prediction)]"
                    class="flex-col gap-0"
                  >
                    <div class="min-w-max">{{ prediction.structured_formatting.main_text }}</div>
                    <div class="truncate text-sm">{{ prediction.structured_formatting.secondary_text }}</div>
                  </Card>
                </template>
                <div v-else class="text-muted">Mencari...</div>
              </template>
              <div v-else>Masukkan kata kunci untuk mencari lokasi</div>
            </Card>
          </template>
        </Popover>
        <div class="flex h-full flex-col justify-between">
          <div class="flex flex-col gap-8">
            <Card color="surfaceContainerHigh" class="flex-row items-center gap-4">
              <Tooltip>
                <template #content> Gunakan lokasi saat ini </template>
                <template #trigger>
                  <Button kind="icon" variant="standard" @click="getCurrentLocation"><Icon class="max-h-fit max-w-fit" name="map-pin" /></Button>
                </template>
              </Tooltip>
              <div v-if="modelValue" class="flex flex-col gap-2">
                <div>{{ modelValue?.lat }}, {{ modelValue?.lng }}</div>
                <div v-if="modelValue?.formatted_address">{{ modelValue.formatted_address }}</div>
              </div>
              <p v-else class="text-muted">Klik pada peta atau tekan tombol untuk memilih lokasi</p>
            </Card>
            <Form v-if="formConfig && modelValue" static v-model="formModel as any" v-bind="formConfig"></Form>
          </div>
          <div v-if="loading" class="flex flex-row items-center gap-4">
            <Spinner />
            <div>Memuat...</div>
          </div>
        </div>
      </div>
      <div class="col-span-9 w-full rounded-full">
        <GoogleMap
          class="h-[450px] w-full"
          :apiKey="GOOGLE_MAP_API_KEY"
          :center="center"
          :zoom="zoom"
          @click="
            (e) => {
              modelValue = { lat: e.latLng?.lat(), lng: e.latLng?.lng() }
              emit('validation:touch')
            }
          "
        >
          <Marker
            v-if="modelValue?.lat && modelValue?.lng"
            :options="{ position: { lat: Number(modelValue?.lat || -6.1753924), lng: Number(modelValue?.lng || 106.8271528) }, draggable: true }"
            @dragend="handlePinDragEnd($event)"
          />
        </GoogleMap>
      </div>
    </div>
  </BaseInput>
</template>
