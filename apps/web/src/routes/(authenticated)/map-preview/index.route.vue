<script setup lang="ts">
import { ref } from 'vue'
import { PageHeader, type Coordinate } from '@southneuhof/loom'
import LocationInput from '@southneuhof/loom/components/composites/form-inputs/LocationInput.vue'
import { locationOperations } from '@/framework/adapters/location'

const location = ref<Coordinate | null | undefined>(null)
</script>

<template>
  <div class="flex flex-col gap-2">
    <PageHeader title="Pratinjau peta" />
    <p>Cari lokasi, klik peta, atau geser penanda untuk memilih koordinat.</p>
    <LocationInput v-model="location" label="Lokasi" map-provider="openstreetmap" :operations="locationOperations" />
  </div>
</template>
