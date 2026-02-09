'use client'

import { useState } from 'react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const testEmail = async () => {
    if (!email) return
    
    setLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ Success: ${data.message}`)
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Email System</h1>
        
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
          />
          
          <button
            onClick={testEmail}
            disabled={loading || !email}
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </button>
          
          {result && (
            <div className="p-4 bg-gray-800 rounded">
              <pre className="text-sm">{result}</pre>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-sm text-gray-400">
          <p>This will test if Resend is working properly.</p>
          <p>Check your email inbox and spam folder.</p>
        </div>
      </div>
    </div>
  )
}