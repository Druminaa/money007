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
    <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 400, y: -50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 400, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative flex items-start p-4 rounded-2xl shadow-2xl backdrop-blur-md border-0 overflow-hidden ${
              toast.type === 'success' 
                ? 'bg-gradient-to-r from-emerald-500/95 to-green-500/95 text-white' 
                : 'bg-gradient-to-r from-red-500/95 to-pink-500/95 text-white'
            }`}
          >
            <div className={`absolute inset-0 opacity-20 ${
              toast.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'
            }`} />
            
            <div className="relative flex items-center w-full">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                toast.type === 'success' ? 'bg-white/20' : 'bg-white/20'
              }`}>
                {toast.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <XCircle className="w-5 h-5 text-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">
                  {toast.message}
                </p>
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-white/20 transition-colors duration-200"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-1 ${
                toast.type === 'success' ? 'bg-white/30' : 'bg-white/30'
              }`}
            />
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