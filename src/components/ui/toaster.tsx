'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface Toast {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

const toasts: Toast[] = []
const listeners: ((toasts: Toast[]) => void)[] = []

function emitChange() {
  listeners.forEach((listener) => listener([...toasts]))
}

export function toast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substr(2, 9)
  const newToast = { ...toast, id }
  toasts.push(newToast)
  emitChange()

  if (toast.duration !== 0) {
    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id)
      if (index > -1) {
        toasts.splice(index, 1)
        emitChange()
      }
    }, toast.duration || 5000)
  }
}

export function Toaster() {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setToastList)
    return () => {
      const index = listeners.indexOf(setToastList)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  const removeToast = (id: string) => {
    const index = toasts.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
      emitChange()
    }
  }

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      default:
        return <Info className="w-5 h-5 text-[color:var(--accent-hi)]" />
    }
  }

  const getStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-500/20 bg-green-500/10'
      case 'error':
        return 'border-red-500/20 bg-red-500/10'
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/10'
      default:
        return 'border-white/10 bg-white/[0.03]'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastList.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full rounded-2xl border p-4 shadow-premium backdrop-blur-md animate-slide-up ${getStyles(toast.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="ml-3 w-0 flex-1">
              {toast.title && (
                <p className="text-sm font-medium text-white">
                  {toast.title}
                </p>
              )}
              {toast.description && (
                <p className="mt-1 text-sm text-white/70">
                  {toast.description}
                </p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="inline-flex text-white/55 hover:text-white focus:outline-none"
                onClick={() => removeToast(toast.id)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
