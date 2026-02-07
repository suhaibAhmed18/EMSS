'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
  persistent?: boolean
}

interface NotificationSystemProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

const NotificationItem = ({ notification, onRemove }: { notification: Notification; onRemove: (id: string) => void }) => {
  useEffect(() => {
    if (!notification.persistent && notification.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(notification.id)
      }, notification.duration || 5000)

      return () => clearTimeout(timer)
    }
  }, [notification, onRemove])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[color:var(--accent-hi)]" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-900/20 border-green-500/20'
      case 'error':
        return 'bg-red-900/20 border-red-500/20'
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/20'
      case 'info':
      default:
        return 'bg-white/[0.03] border-white/10'
    }
  }

  return (
    <div className={`${getBgColor()} rounded-2xl border p-4 shadow-premium backdrop-blur-md`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-white">
            {notification.title}
          </h4>
          <p className="text-sm text-white/70 mt-1">
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="ml-4 flex-shrink-0 text-white/55 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function NotificationSystem({ notifications, onRemove }: NotificationSystemProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
