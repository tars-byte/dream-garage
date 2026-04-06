import { useEffect, type ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  /** Tailwind max-height class, e.g. 'max-h-[85vh]' */
  maxHeightClass?: string
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  maxHeightClass = 'max-h-[85vh]',
}: BottomSheetProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          'fixed inset-0 z-40 bg-black/70 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={[
          'fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl',
          'flex flex-col transition-transform duration-300 ease-out',
          maxHeightClass,
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {title && (
          <div className="px-4 pb-3 text-lg font-semibold text-text shrink-0 border-b border-border">
            {title}
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </>
  )
}
