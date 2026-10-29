import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { useCreateMonitor, useUpdateMonitor } from '../../api/queries'
import { INTERVAL_OPTIONS, monitorInputSchema, type Monitor, type MonitorInput } from '../../api/schemas'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/toast-context'
import { en, type MessageKey } from '../../i18n/en'
import { useI18n } from '../../i18n/i18n-context'

type FieldErrors = Partial<Record<keyof MonitorInput, string>>

interface MonitorFormModalProps {
  open: boolean
  onClose: () => void
  /** Edit this monitor; create a new one when omitted. */
  monitor?: Monitor
  onCreated?: (monitor: Monitor) => void
}

export function MonitorFormModal({ open, onClose, monitor, onCreated }: MonitorFormModalProps) {
  const { t } = useI18n()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={monitor ? t('form.editTitle') : t('form.createTitle')}
      description={t('form.description')}
    >
      <MonitorForm monitor={monitor} onDone={onClose} onCreated={onCreated} />
    </Modal>
  )
}

function MonitorForm({
  monitor,
  onDone,
  onCreated,
}: {
  monitor?: Monitor
  onDone: () => void
  onCreated?: (monitor: Monitor) => void
}) {
  const { t } = useI18n()
  const toast = useToast()
  const create = useCreateMonitor()
  const update = useUpdateMonitor()
  const [values, setValues] = useState({
    name: monitor?.name ?? '',
    url: monitor?.url ?? 'https://',
    intervalSec: String(monitor?.intervalSec ?? 60),
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const pending = create.isPending || update.isPending

  const translate = (message: string | undefined) =>
    message && message in en ? t(message as MessageKey) : message

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = monitorInputSchema.safeParse({ ...values, intervalSec: Number(values.intervalSec) })
    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors
      setErrors({
        name: translate(fieldErrors.name?.[0]),
        url: translate(fieldErrors.url?.[0]),
        intervalSec: translate(fieldErrors.intervalSec?.[0]),
      })
      // Move focus to the first invalid field.
      const firstInvalid = (['name', 'url', 'intervalSec'] as const).find((key) => fieldErrors[key])
      if (firstInvalid) event.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    setErrors({})
    const input = result.data
    // mutateAsync, not mutate callbacks: the form unmounts when the modal closes.
    const request = monitor
      ? update.mutateAsync({ id: monitor.id, patch: input })
      : create.mutateAsync(input)
    request.then(
      (saved) => {
        toast(t(monitor ? 'toast.updated' : 'toast.created', { name: saved.name }))
        onDone()
        if (!monitor) onCreated?.(saved)
      },
      (error: Error) => toast(t('toast.error', { message: error.message }), 'error'),
    )
  }

  const set = (key: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <Field label={t('form.name')} error={errors.name}>
        {(props) => (
          <Input
            {...props}
            name="name"
            autoFocus
            autoComplete="off"
            placeholder={t('form.namePlaceholder')}
            value={values.name}
            onChange={(e) => set('name')(e.target.value)}
          />
        )}
      </Field>
      <Field label={t('form.url')} hint={t('form.urlHint')} error={errors.url}>
        {(props) => (
          <Input
            {...props}
            name="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={values.url}
            onChange={(e) => set('url')(e.target.value)}
          />
        )}
      </Field>
      <Field label={t('form.interval')} error={errors.intervalSec}>
        {(props) => (
          <Select
            {...props}
            name="intervalSec"
            value={values.intervalSec}
            onChange={(e) => set('intervalSec')(e.target.value)}
          >
            {INTERVAL_OPTIONS.map((seconds) => (
              <option key={seconds} value={seconds}>
                {t(`form.interval.${seconds}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button onClick={onDone} disabled={pending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? t('form.saving') : monitor ? t('common.save') : t('form.create')}
        </Button>
      </div>
    </form>
  )
}
