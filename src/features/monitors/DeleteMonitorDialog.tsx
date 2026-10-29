import { useDeleteMonitor } from '../../api/queries'
import type { Monitor } from '../../api/schemas'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/toast-context'
import { useI18n } from '../../i18n/i18n-context'

interface DeleteMonitorDialogProps {
  monitor: Monitor
  open: boolean
  onClose: () => void
  /** Called right away: the delete is optimistic, so the caller can leave the page. */
  onDeleted: () => void
}

export function DeleteMonitorDialog({ monitor, open, onClose, onDeleted }: DeleteMonitorDialogProps) {
  const { t } = useI18n()
  const toast = useToast()
  const remove = useDeleteMonitor()

  function confirm() {
    // mutateAsync, not mutate callbacks: this dialog unmounts as soon as the caller navigates away.
    remove.mutateAsync(monitor.id).then(
      () => toast(t('toast.deleted', { name: monitor.name })),
      (error: Error) => toast(t('toast.error', { message: error.message }), 'error'),
    )
    onClose()
    onDeleted()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={t('confirm.deleteTitle', { name: monitor.name })}
      description={t('confirm.deleteBody')}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onClose} autoFocus>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={confirm}>
          {t('confirm.delete')}
        </Button>
      </div>
    </Modal>
  )
}
