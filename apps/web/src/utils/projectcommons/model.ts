import { toast } from 'vue-sonner'
import services from '../services'
import { keyManager } from '@/stores/keyManager'

export async function syncModel(model: string, title: string, onSuccess: () => void) {
  toast.promise(services.get(`sync`, { model }), {
    loading: `Mensinkronisasi data ${title}...`,
    success: () => {
      onSuccess()
      return `Data ${title} berhasil disinkronisasi`
    },
    error: `Gagal mensinkronisasi data ${title}`,
  })
}
