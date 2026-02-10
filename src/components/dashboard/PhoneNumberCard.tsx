'use client'

import { useState, useEffect } from 'react'
import { Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function PhoneNumberCard() {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPhoneNumber()
  }, [])

  const fetchPhoneNumber = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/telnyx/assign-number')
      const data = await response.json()

      if (response.ok) {
        setPhoneNumber(data.phoneNumber)
      } else {
        setError(data.error || 'Failed to fetch phone number')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const assignPhoneNumber = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/telnyx/assign-number', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        setPhoneNumber(data.phoneNumber)
      } else {
        setError(data.error || 'Failed to assign phone number')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-premium p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] flex-shrink-0">
          <Phone className="h-6 w-6 text-white/80" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            SMS Phone Number
          </h3>
          
          {loading ? (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
              {!phoneNumber && (
                <button
                  onClick={assignPhoneNumber}
                  className="btn-secondary text-sm"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : phoneNumber ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-300" />
                <span className="text-white font-mono text-lg">{phoneNumber}</span>
              </div>
              <p className="text-white/60 text-sm">
                Use this number to send SMS campaigns to your contacts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-white/60 text-sm">
                No phone number assigned yet. Click below to get your Telnyx number.
              </p>
              <button
                onClick={assignPhoneNumber}
                className="btn-primary text-sm"
              >
                Get Phone Number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
