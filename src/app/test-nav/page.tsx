'use client'

export default function TestNavPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Navigation Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg mb-2">Test Links:</h2>
          <div className="space-x-4">
            <a 
              href="/auth/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              onClick={() => console.log('Login link clicked')}
            >
              Go to Login
            </a>
            <a 
              href="/auth/register" 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={() => console.log('Register link clicked')}
            >
              Go to Register
            </a>
            <a 
              href="/dashboard" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              onClick={() => console.log('Dashboard link clicked')}
            >
              Go to Dashboard
            </a>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg mb-2">Current URL:</h2>
          <p className="text-gray-400">{typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
        </div>
        
        <div>
          <h2 className="text-lg mb-2">JavaScript Test:</h2>
          <button 
            onClick={() => {
              console.log('Button clicked!')
              alert('JavaScript is working!')
            }}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
          >
            Test JavaScript
          </button>
        </div>
      </div>
    </div>
  )
}