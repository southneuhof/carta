import { ref, shallowRef } from 'vue'
import { toast } from 'vue-sonner'
import type { ConfirmationDialogActions } from '@southneuhof/loom/components/composites/ConfirmationDialog.vue'

type UseConfirmDeleteOptions = {
  /** Called after a successful delete (invalidate queries, reload a tree, ...). */
  after?: () => Promise<unknown> | void
  successMessage?: string
  /** Toasts the route-owned fallback text; the dialog stays open on failure. */
  onError?: (error: unknown) => unknown
}

/**
 * Shared delete-confirmation plumbing for custom surfaces that render outside
 * the standard views: the asked target, the dialog actions, and the success /
 * error toasts. Pair the returned `actions` with ConfirmationDialog and call
 * `ask(row)` from the row trigger.
 */
export function useConfirmDelete(run: (target: unknown) => Promise<unknown>, options: UseConfirmDeleteOptions = {}) {
  const target = shallowRef<unknown>(null)
  const busy = ref(false)

  function ask(row: unknown) {
    target.value = row
  }

  async function confirm(setOpen: (open: boolean) => void) {
    const current = target.value
    if (!current) return setOpen(false)
    busy.value = true
    try {
      await run(current)
      toast.success(options.successMessage ?? 'Berhasil menghapus data!')
      target.value = null
      await options.after?.()
      setOpen(false)
    } catch (error) {
      options.onError?.(error)
    } finally {
      busy.value = false
    }
  }

  function cancel(setOpen: (open: boolean) => void) {
    target.value = null
    setOpen(false)
  }

  const actions: ConfirmationDialogActions[] = [
    { label: 'Lanjut', appearance: { color: 'primary', variant: 'filled' }, onClick: confirm },
    { label: 'Batal', appearance: { color: 'error', variant: 'filled' }, onClick: cancel },
  ]

  return { target, busy, ask, actions }
}
