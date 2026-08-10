<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { createUser } from './create.operations'

const router = useRouter()
const pending = ref(false)
const model = reactive({ name: '', username: '', email: '', password: '', imgPhotoUser: '' })
async function submit() {
  if (pending.value) return
  pending.value = true
  try {
    await createUser(model)
    await router.replace({ name: 'settings-users' })
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'User could not be created.')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="flex max-w-xl flex-col gap-4" @submit.prevent="submit">
    <h1 class="text-xl font-semibold">Create User</h1>
    <label>Name <input v-model="model.name" required /></label>
    <label>Username <input v-model="model.username" required /></label>
    <label>Email <input v-model="model.email" type="email" required /></label>
    <label>Password <input v-model="model.password" type="password" minlength="8" required /></label>
    <label>Photo Key <input v-model="model.imgPhotoUser" /></label>
    <button type="submit" :disabled="pending">{{ pending ? 'Saving…' : 'Save' }}</button>
  </form>
</template>
