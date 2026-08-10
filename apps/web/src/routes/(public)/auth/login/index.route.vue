<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storage } from '@southneuhof/utilities/storage'
import { permissions } from '@/stores/permissions'
import Logo from '@/assets/corporate/common/Logo.vue'
import { resolvePostLoginRoute } from '@/router/navigation'
import { consumePostLoginRedirect } from '@/utils/post-login-redirect'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Toast from '@southneuhof/is-vue-framework/components/base/Toast.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import TextInput from '@southneuhof/is-vue-framework/components/inputs/TextInput.vue'
import PasswordInput from '@southneuhof/is-vue-framework/components/inputs/PasswordInput.vue'
import { rpc } from '@/framework/rpc'

const loginMessage = ref<{ message: string; type: 'error' | 'warning' | 'info' | 'success' | undefined }>({ message: '', type: undefined })
const router = useRouter()
const loading = ref(false)
const formData = ref({ email: '', password: '' })

const INVALID_CREDENTIALS_MESSAGE = 'Email atau password tidak valid'
const CONNECTION_ERROR_MESSAGE = 'Tidak dapat terhubung ke server. Silakan coba lagi'
const PERMISSION_ERROR_MESSAGE = 'Gagal memuat akses aplikasi. Silakan coba lagi'
const NO_ACCESS_MESSAGE = 'Anda tidak memiliki akses ke aplikasi ini'
const NO_DESTINATION_MESSAGE = 'Tidak ada halaman yang dapat diakses oleh akun ini'

function clearStagedAccess() {
  permissions().clear()
}

async function rejectLogin(message: string, sessionEstablished: boolean, clearAccess = false) {
  if (clearAccess) clearStagedAccess()
  if (sessionEstablished) {
    try {
      await rpc.api.auth['sign-out'].$post()
    } catch (_) {}
  }
  loginMessage.value = { message, type: 'error' }
}

async function login() {
  loading.value = true
  loginMessage.value = { message: '', type: undefined }
  let sessionEstablished = false
  let failureStage: 'sign-in' | 'permissions' = 'sign-in'
  try {
    const loginResponse = await rpc.api.auth['sign-in'].email.$post({ json: formData.value })
    if (!loginResponse.ok) {
      await rejectLogin(INVALID_CREDENTIALS_MESSAGE, false)
      return
    }

    const loginData = await loginResponse.json()
    if (!loginData?.user) {
      await rejectLogin(INVALID_CREDENTIALS_MESSAGE, false)
      return
    }

    sessionEstablished = true
    failureStage = 'permissions'
    const { user } = loginData
    // Permissions union across every active role, so they come from the server's
    // resolved identity rather than from one role's permission list.
    const identityResponse = await rpc.me.$get()
    if (!identityResponse.ok) {
      await rejectLogin(PERMISSION_ERROR_MESSAGE, sessionEstablished)
      return
    }

    const identityData = await identityResponse.json()
    const identity = identityData?.data
    if (!identity || !Array.isArray(identity.permissions)) {
      await rejectLogin(PERMISSION_ERROR_MESSAGE, sessionEstablished)
      return
    }

    const profile = { ...user, role_id: identity.roleCodes[0] ?? '', fullname: user.name, username: identity.user.username ?? user.email }
    const tasks = identity.permissions

    if (tasks.length === 0) {
      await rejectLogin(NO_ACCESS_MESSAGE, sessionEstablished, true)
      return
    }

    permissions().build(tasks)
    const destination = resolvePostLoginRoute(router, consumePostLoginRedirect())
    if (!destination) {
      await rejectLogin(NO_DESTINATION_MESSAGE, sessionEstablished, true)
      return
    }

    storage.localStorage.set('profile', profile)
    storage.localStorage.set('permissions', tasks)
    await router.push(destination)
  } catch (_) {
    await rejectLogin(failureStage === 'permissions' ? PERMISSION_ERROR_MESSAGE : CONNECTION_ERROR_MESSAGE, sessionEstablished, failureStage === 'permissions')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card class="flex flex-col gap-16 p-8">
    <div class="flex flex-row items-center gap-8"><Logo class="w-16" /></div>
    <div class="flex flex-col gap-4">
      <div class="text-lg">Welcome to</div>
      <div class="text-4xl font-bold">Demo App</div>
    </div>
    <form class="flex flex-col items-center gap-4" @submit.prevent="login">
      <TextInput class="w-full" :model-value="formData.email" @update:model-value="(value) => (formData.email = String(value))" label="Email" enableHelperMessage required />
      <PasswordInput class="w-full" :model-value="formData.password" @update:model-value="(value) => (formData.password = String(value))" label="Password" enableHelperMessage required />
      <div v-if="!loading" class="flex w-full flex-row items-center gap-2">
        <Button :disabled="loading" type="submit" class="mt-6 w-full">Login</Button>
      </div>
      <Button v-else disabled variant="tonal" class="mt-6 w-full"><Spinner /></Button>
    </form>
    <div class="flex w-full items-center justify-center">
      <Toast v-if="loginMessage.message" :type="loginMessage.type">{{ loginMessage.message }}</Toast>
    </div>
    <div class="text-center text-muted">Company Ltd.</div>
  </Card>
</template>
