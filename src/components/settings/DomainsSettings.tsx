'use client'

import { useState, useEffect } from 'react'
import { Plus, ExternalLink, Info, Check, X, AlertCircle } from 'lucide-react'

export default function DomainsSettings() {
  const [domains, setDomains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null)
  const [businessEmail, setBusinessEmail] = useState('')
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<any>(null)
  const [newDomain, setNewDomain] = useState('')
  const [domainType, setDomainType] = useState('email')
  const [addingDomain, setAddingDomain] = useState(false)

  useEffect(() => {
    loadDomains()
  }, [])

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/settings/domains')
      if (response.ok) {
        const data = await response.json()
        setDomains(data.domains || [])
      }
    } catch (error) {
      console.error('Failed to load domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyDomain = async (domain: any) => {
    setSelectedDomain(domain)
    setBusinessEmail('')
    setShowVerifyModal(true)
  }

  const submitVerification = async () => {
    if (!selectedDomain) return

    setVerifyingDomain(selectedDomain.id)
    try {
      const response = await fetch('/api/settings/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: selectedDomain.id,
          businessEmail: businessEmail || undefined
        })
      })

      const result = await response.json()

      if (response.ok && result.verified) {
        // Reload domains to show updated status
        await loadDomains()
        setShowVerifyModal(false)
        setSelectedDomain(null)
        setBusinessEmail('')
        alert('Domain verified successfully!')
      } else {
        alert(result.error || 'Domain verification failed')
      }
    } catch (error) {
      console.error('Failed to verify domain:', error)
      alert('Failed to verify domain')
    } finally {
      setVerifyingDomain(null)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      alert('Please enter a domain')
      return
    }

    setAddingDomain(true)
    try {
      const response = await fetch('/api/settings/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.trim(),
          type: domainType
        })
      })

      const result = await response.json()

      if (response.ok) {
        await loadDomains()
        setShowAddModal(false)
        setNewDomain('')
        setDomainType('email')
        alert('Domain added successfully! Please configure DNS records and verify.')
      } else {
        alert(result.error || 'Failed to add domain')
      }
    } catch (error) {
      console.error('Failed to add domain:', error)
      alert('Failed to add domain')
    } finally {
      setAddingDomain(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Domains</h2>
        <p className="text-sm text-white/60 mb-4">
          In this section, you can add a domain that appears after "@" in your emails or use a domain for branded SMS short links. 
          Custom domains help improve email deliverability and make both emails and SMS messages look more on-brand.
        </p>
        <a href="#" className="text-sm text-[#16a085] hover:underline inline-flex items-center">
          Find out more <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Your domains</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add domain
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.05] mb-4">
              <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-white/60 mb-2">No sender domains in sight. We've got our glasses on just in case.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/70">DOMAIN</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/70">TYPE</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/70">VERIFICATION STATUS</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/70">
                    <div className="flex items-center">
                      AUTOMATIC WARMUP
                      <Info className="w-3 h-3 ml-1 text-white/50" />
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-white/70"></th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain) => (
                  <tr key={domain.id} className="border-b border-white/10">
                    <td className="py-4 px-4 text-sm text-white">{domain.domain}</td>
                    <td className="py-4 px-4 text-sm text-white">{domain.type}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        domain.verified 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {domain.verified ? (
                          <><Check className="w-3 h-3 mr-1" /> Verified</>
                        ) : (
                          <><AlertCircle className="w-3 h-3 mr-1" /> Pending</>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-white">
                      {domain.autoWarmup ? 'Enabled' : 'Disabled'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {!domain.verified ? (
                        <button 
                          onClick={() => handleVerifyDomain(domain)}
                          disabled={verifyingDomain === domain.id}
                          className="text-sm text-[#16a085] hover:underline disabled:opacity-50"
                        >
                          {verifyingDomain === domain.id ? 'Verifying...' : 'Verify'}
                        </button>
                      ) : (
                        <button className="text-sm text-[#16a085] hover:underline">
                          Configure
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

      {/* Domain in use section */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Domain in use</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Campaigns</label>
            <select className="input-premium w-full">
              <option>Shared domain</option>
            </select>
            <p className="text-xs text-white/50 mt-2">
              This domain will be used to send out campaign emails
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Automations</label>
            <select className="input-premium w-full">
              <option>Shared domain</option>
            </select>
            <p className="text-xs text-white/50 mt-2">
              This domain will be used to send out automation emails
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">SMS short links</label>
            <select className="input-premium w-full">
              <option>Sendra shared short link</option>
            </select>
            <p className="text-xs text-white/50 mt-2">
              This domain will be used for short links in SMS communication
            </p>
          </div>
        </div>
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1f2e] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Add Domain
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="input-premium w-full"
                />
                <p className="text-xs text-white/50 mt-2">
                  Enter your domain without http:// or www
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Domain Type
                </label>
                <select
                  value={domainType}
                  onChange={(e) => setDomainType(e.target.value)}
                  className="input-premium w-full"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
                <p className="text-xs text-white/50 mt-2">
                  Choose how you'll use this domain
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewDomain('')
                    setDomainType('email')
                  }}
                  disabled={addingDomain}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDomain}
                  disabled={addingDomain || !newDomain.trim()}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {addingDomain ? 'Adding...' : 'Add Domain'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerifyModal && selectedDomain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1f2e] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Verify Domain: {selectedDomain.domain}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/70 mb-4">
                  Before verifying, please ensure you've configured the DNS records for your domain.
                </p>
                
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Business Email (Optional)
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder={`e.g., contact@${selectedDomain.domain}`}
                  className="input-premium w-full"
                />
                <p className="text-xs text-white/50 mt-2">
                  Enter a business email address for this domain. It will be stored after verification.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowVerifyModal(false)
                    setSelectedDomain(null)
                    setBusinessEmail('')
                  }}
                  disabled={verifyingDomain === selectedDomain.id}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitVerification}
                  disabled={verifyingDomain === selectedDomain.id}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {verifyingDomain === selectedDomain.id ? 'Verifying...' : 'Verify Domain'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
