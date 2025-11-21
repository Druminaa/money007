import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastProps {
  toasts: Toast[]
  removeToast: (id: number) => void
}

export function ToastContainer({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center p-4 rounded-xl shadow-lg backdrop-blur-sm border ${
              toast.type === 'success' 
                ? 'bg-green-50/90 border-green-200 text-green-800' 
                : 'bg-red-50/90 border-red-200 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 mr-3 text-red-600" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error')
  }

  return { toasts, removeToast, toast }
}