'use client'

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [authData, setAuthData] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check auth status
        const authResponse = await fetch('/api/auth/session')
        const authResult = await authResponse.json()
        setAuthData(authResult)

        // Check dashboard data
        const dashboardResponse = await fetch('/api/dashboard')
        const dashboardResult = await dashboardResponse.json()
        setDashboardData(dashboardResult)
      } catch (error) {
        console.error('Debug fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8 bg-black text-white">Loading debug info...</div>
  }

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Auth Status</h2>
          <pre className="text-sm text-green-400 overflow-auto">
            {JSON.stringify(authData, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Dashboard Data</h2>
          <pre className="text-sm text-blue-400 overflow-auto">
            {JSON.stringify(dashboardData, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current URL</h2>
          <p className="text-yellow-400">{typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
        </div>

        <div className="space-x-4">
          <a href="/dashboard" className="bg-blue-600 px-4 py-2 rounded">Go to Dashboard</a>
          <a href="/stores/connect" className="bg-green-600 px-4 py-2 rounded">Go to Connect Store</a>
        </div>
      </div>
    </div>
  )
}