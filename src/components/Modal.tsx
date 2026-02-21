import React, { useId } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'info' | 'primary'
  showCancelButton?: boolean
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  showCancelButton = false,
  onConfirm,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar'
}) => {
  const titleId = useId()
  const descriptionId = useId()

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const getIconByType = () => {
    const baseIconClasses = 'flex h-10 w-10 items-center justify-center rounded-full'

    switch (type) {
      case 'primary':
        return (
          <div className={`${baseIconClasses} bg-[#f74116]/10 text-[#f74116]`}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v6" />
              <path d="M12 16h.01" />
            </svg>
          </div>
        )
      case 'success':
        return (
          <div className={`${baseIconClasses} bg-green-100 text-green-600`}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className={`${baseIconClasses} bg-red-100 text-red-600`}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        )
      default:
        return (
          <div className={`${baseIconClasses} bg-blue-100 text-blue-600`}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v6" />
              <path d="M12 16h.01" />
            </svg>
          </div>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="mx-4 w-full max-w-[500px] transform overflow-hidden rounded-xl bg-white shadow-xl transition-all duration-300 sm:mx-0 sm:min-w-[400px]"
        role="dialog"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 pb-4 pt-5">
          {getIconByType()}
          <h3 className="flex-1 text-lg font-semibold text-slate-800" id={titleId}>
            {title}
          </h3>
          <button
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 pb-5 pt-0">
          <p className="text-[15px] leading-relaxed text-slate-600" id={descriptionId}>
            {message}
          </p>
        </div>
        <div className="flex flex-col gap-3 px-6 pb-6 pt-4 sm:flex-row sm:justify-end">
          {showCancelButton && (
            <button
              className="min-w-[80px] w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`min-w-[80px] w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto ${
              type === 'error'
                ? 'bg-red-600 hover:bg-red-500 focus:ring-red-200'
                : type === 'success'
                  ? 'bg-green-600 hover:bg-green-500 focus:ring-green-200'
                  : type === 'primary'
                    ? 'bg-[#f74116] hover:bg-[#d63912] focus:ring-[#f74116]/30'
                    : 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-200'
            }`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
