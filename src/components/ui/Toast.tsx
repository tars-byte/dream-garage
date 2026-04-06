import { useEffect, useState } from 'react'

export interface ToastData {
  id: string
  message: string
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)
  const duration = toast.durationMs ?? 4000

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true))

    // Auto-dismiss
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.id, duration, onDismiss])

  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 bg-surface-elevated border border-border rounded-xl shadow-xl text-sm',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      ].join(' ')}
    >
      <span className="text-text flex-1">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          onClick={() => {
            toast.onAction?.()
            onDismiss(toast.id)
          }}
          className="text-accent font-semibold text-sm shrink-0 hover:text-accent-hover transition-colors"
        >
          {toast.actionLabel}
        </button>
      )}
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  function show(data: Omit<ToastData, 'id'>) {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...data, id }])
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, show, dismiss }
}
