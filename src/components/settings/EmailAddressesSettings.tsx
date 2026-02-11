'use client'

import { useState, useEffect } from 'react'
import { Plus, ExternalLink, Check, AlertCircle, Trash2 } from 'lucide-react'

export default function EmailAddressesSettings() {
  const [emailAddresses, setEmailAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadEmailAddresses()
  }, [])

  const loadEmailAddresses = async () => {
    try {
      const response = await fetch('/api/settings/email-addresses')
      if (response.ok) {
        const data = await response.json()
        setEmailAddresses(data.emailAddresses || [
          {
            id: '1',
            email: 'Shared Sendra Email',
            status: 'Verified',
            verifiedOn: null,
            isShared: true
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load email addresses:', error)
      // Set default shared email
      setEmailAddresses([
        {
          id: '1',
          email: 'Shared Sendra Email',
          status: 'Verified',
          verifiedOn: null,
          isShared: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmail = async (email: string) => {
    try {
      const response = await fetch('/api/settings/email-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        await loadEmailAddresses()
        setShowAddModal(false)
        alert(result.message || 'Email address added. Verification can take up to 2 days.')
      } else {
        alert(result.error || 'Failed to add email address')
      }
    } catch (error) {
      console.error('Failed to add email:', error)
    }
  }

  const handleDeleteEmail = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email address?')) return
    
    try {
      const response = await fetch(`/api/settings/email-addresses/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadEmailAddresses()
      } else {
        const errorData = await response.json()
        console.error('Failed to delete email:', errorData)
        alert(`Failed to delete email: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete email:', error)
      alert('Failed to delete email address')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Email Addresses</h2>
        <p className="text-sm text-white/60 mb-4">
          Add and verify your email addresses to use as senders in your email campaigns. With our Sendra shared email, 
          you can send messages immediately. If you prefer using your brand's email, verify it with your custom domain.
          Note: Email verification through Resend API can take up to 2 days to complete.
        </p>
        <a href="#" className="text-sm text-[#16a085] hover:underline inline-flex items-center">
          Find out more <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Your email addresses</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add email address
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/70">EMAIL ADDRESS</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/70">STATUS</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/70">VERIFIED ON</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-white/70"></th>
                </tr>
              </thead>
              <tbody>
                {emailAddresses.map((emailAddr) => (
                  <tr key={emailAddr.id} className="border-b border-white/10">
                    <td className="py-4 px-4 text-sm text-white">{emailAddr.email}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        emailAddr.status === 'Verified'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {emailAddr.status === 'Verified' ? (
                          <><Check className="w-3 h-3 mr-1" /> Verified</>
                        ) : (
                          <><AlertCircle className="w-3 h-3 mr-1" /> Pending</>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-white">
                      {emailAddr.verifiedOn || '-'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {!emailAddr.isShared && (
                        <button 
                          onClick={() => handleDeleteEmail(emailAddr.id)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Email Modal */}
      {showAddModal && (
        <AddEmailModal 
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddEmail}
        />
      )}
    </div>
  )
}

function AddEmailModal({ onClose, onAdd }: { onClose: () => void, onAdd: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onAdd(email)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-premium p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-4">Add Email Address</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-premium w-full"
              placeholder="your-email@yourdomain.com"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Adding...' : 'Add Email'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
