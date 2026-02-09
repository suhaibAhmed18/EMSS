'use client'

import { useSession } from '@/lib/auth/session'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const { user, loading } = useSession()
  const [sessionData, setSessionData] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    // Check session via API
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setSessionData(data))
      .catch(err => console.error('Session check failed:', err))

    // Get cookies
    setCookies(document.cookie)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Provider State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Provider State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}</p>
              {user && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Name:</strong> {user.name || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>

          {/* API Session Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Session Check</h2>
            <div className="space-y-2">
              {sessionData ? (
                <div>
                  <p><strong>API Response:</strong></p>
                  <pre className="mt-2 p-4 bg-gray-50 rounded text-sm overflow-auto">
                    {JSON.stringify(sessionData, null, 2)}
                  </pre>
                </div>
              ) : (
                <p>Loading session data...</p>
              )}
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Browser Cookies</h2>
            <div className="space-y-2">
              <p><strong>All Cookies:</strong></p>
              <pre className="mt-2 p-4 bg-gray-50 rounded text-sm overflow-auto">
                {cookies || 'No cookies found'}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  fetch('/api/auth/session', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                      setSessionData(data)
                      console.log('Session refresh:', data)
                    })
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Refresh Session
              </button>
              <button
                onClick={() => {
                  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                    .then(() => window.location.href = '/')
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}