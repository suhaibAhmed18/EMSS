'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Users,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Tag,
  Calendar
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationSystem from '@/components/notifications/NotificationSystem'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  tags: string[]
  segments: string[]
  total_spent: number
  order_count: number
  last_order_at?: string
  email_consent: boolean
  sms_consent: boolean
  created_at: string
  updated_at: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSegment, setSelectedSegment] = useState('All Contacts')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    tags: [] as string[],
    email_consent: true,
    sms_consent: false
  })

  const { notifications, removeNotification, showSuccess, showError } = useNotifications()

  // Load contacts on component mount
  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contacts')
      if (!response.ok) {
        throw new Error('Failed to load contacts')
      }
      const data = await response.json()
      setContacts(data.contacts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  // Calculate segments based on real data
  const segments = [
    { name: 'All Contacts', count: contacts.length },
    { name: 'Email Subscribers', count: contacts.filter(c => c.email_consent).length },
    { name: 'SMS Subscribers', count: contacts.filter(c => c.sms_consent).length },
    { name: 'High Value Customers', count: contacts.filter(c => (c.total_spent || 0) > 1000).length },
    { name: 'Recent Customers', count: contacts.filter(c => c.last_order_at && new Date(c.last_order_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length },
  ]

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone && contact.phone.includes(searchTerm))

    let matchesSegment = true
    if (selectedSegment === 'Email Subscribers') {
      matchesSegment = contact.email_consent
    } else if (selectedSegment === 'SMS Subscribers') {
      matchesSegment = contact.sms_consent
    } else if (selectedSegment === 'High Value Customers') {
      matchesSegment = (contact.total_spent || 0) > 1000
    } else if (selectedSegment === 'Recent Customers') {
      matchesSegment = !!(contact.last_order_at && new Date(contact.last_order_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    }

    return matchesSearch && matchesSegment
  })

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id))
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const response = await fetch('/api/contacts/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'csv',
          includePersonalData: true
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showSuccess('Export Complete', 'Your contacts have been exported successfully')
    } catch (err) {
      showError('Export Failed', err instanceof Error ? err.message : 'Failed to export contacts')
    } finally {
      setExporting(false)
    }
  }

  const handleAddContact = async () => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContact),
      })

      if (!response.ok) {
        throw new Error('Failed to add contact')
      }

      const result = await response.json()
      
      // Add the new contact to the list
      setContacts(prev => [result.contact, ...prev])
      
      // Reset form and close modal
      setNewContact({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        tags: [],
        email_consent: true,
        sms_consent: false
      })
      setShowAddModal(false)
      
      // Show success notification
      showSuccess('Contact Added', `${result.contact.first_name} ${result.contact.last_name} has been added to your contacts.`)
    } catch (err) {
      showError('Failed to Add Contact', err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  const handleImportContacts = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()
      
      // Reload contacts after import
      await loadContacts()
      
      setShowImportModal(false)
      showSuccess('Import Successful', `Successfully imported ${result.imported} contacts`)
    } catch (err) {
      showError('Import Failed', err instanceof Error ? err.message : 'Failed to import contacts')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-premium mb-2">Contacts</h1>
          <p className="text-white/60">Manage your customer contacts and segments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-ghost" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="btn-ghost" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Segments */}
          <div className="lg:col-span-1">
            <div className="card-premium p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Segments</h3>
              <div className="space-y-2">
                {segments.map((segment) => (
                  <button
                    key={segment.name}
                    onClick={() => setSelectedSegment(segment.name)}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                      selectedSegment === segment.name
                        ? 'bg-white/[0.06] border-white/10 text-white'
                        : 'border-transparent text-white/70 hover:text-white hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{segment.name}</span>
                      <span className="text-xs">{segment.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card-premium p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/55">Total Contacts</span>
                  <span className="text-white font-medium">{contacts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/55">Email Subscribers</span>
                  <span className="text-white font-medium">
                    {contacts.filter(c => c.email_consent).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/55">SMS Subscribers</span>
                  <span className="text-white font-medium">
                    {contacts.filter(c => c.sms_consent).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/55">Avg. Order Value</span>
                  <span className="text-white font-medium">
                    ${contacts.length > 0 ? (contacts.reduce((sum, c) => sum + (c.total_spent || 0), 0) / contacts.filter(c => c.order_count > 0).length || 0).toFixed(0) : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {loading && (
              <div className="card-premium p-6 mb-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/60">Loading contacts...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="card-premium p-6 mb-6 border border-red-500">
                <div className="text-center py-4">
                  <p className="text-red-400 mb-2">Error: {error}</p>
                  <button 
                    onClick={loadContacts}
                    className="btn-primary"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            {!loading && (
              <div className="card-premium p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/45 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-premium pl-10 w-full"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button className="btn-ghost">
                      <Filter className="w-4 h-4" />
                      Filters
                    </button>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedContacts.length > 0 && (
                  <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <span className="text-white">
                        {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
                      </span>
                      <div className="flex items-center space-x-2">
                        <button className="btn-ghost text-sm">
                          <Tag className="w-4 h-4" />
                          Add Tags
                        </button>
                        <button className="btn-ghost text-sm">
                          <Mail className="w-4 h-4" />
                          Send Email
                        </button>
                        <button className="btn-ghost text-sm">
                          <MessageSquare className="w-4 h-4" />
                          Send SMS
                        </button>
                        <button className="btn-ghost text-sm text-red-400">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contacts Table */}
            {!loading && (
              <div className="card-premium p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-4 px-4">
                          <input
                            type="checkbox"
                            checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-white/20 bg-white/10 text-white focus:ring-white"
                          />
                        </th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-white/55">Contact</th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-white/55">Tags</th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-white/55">Consent</th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-white/55">Orders</th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-white/55">Total Spent</th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-white/55">Last Order</th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-white/55">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="border-b border-white/10 hover:bg-white/[0.03]">
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact.id)}
                              onChange={() => handleSelectContact(contact.id)}
                              className="rounded border-white/20 bg-white/10 text-white focus:ring-white"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-white">
                                {contact.first_name} {contact.last_name}
                              </div>
                              <div className="text-sm text-white/55">{contact.email}</div>
                              {contact.phone && (
                                <div className="text-sm text-white/55">{contact.phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="badge badge-muted"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  contact.email_consent ? 'bg-[color:var(--accent-hi)]' : 'bg-white/25'
                                }`}
                              />
                              <Mail className="w-4 h-4 text-white/45" />
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  contact.sms_consent ? 'bg-[color:var(--accent-hi)]' : 'bg-white/25'
                                }`}
                              />
                              <MessageSquare className="w-4 h-4 text-white/45" />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-white">{contact.order_count}</td>
                          <td className="py-4 px-4 text-white font-medium">
                            ${(contact.total_spent || 0).toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-white/55">
                            {contact.last_order_at ? new Date(contact.last_order_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredContacts.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-white/35 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No contacts found</h3>
                    <p className="text-white/60 mb-6">
                      {searchTerm || selectedSegment !== 'All Contacts'
                        ? 'Try adjusting your search or segment filter'
                        : 'Get started by adding your first contact'
                      }
                    </p>
                    {!searchTerm && selectedSegment === 'All Contacts' && (
                      <div className="flex justify-center space-x-4">
                        <button 
                          className="btn-primary"
                          onClick={() => setShowAddModal(true)}
                        >
                          <Plus className="w-4 h-4" />
                          Add Contact
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => setShowImportModal(true)}
                        >
                          <Upload className="w-4 h-4" />
                          Import Contacts
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-premium p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Contact</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/55 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newContact.first_name}
                    onChange={(e) => setNewContact({...newContact, first_name: e.target.value})}
                    className="input-premium w-full"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/55 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newContact.last_name}
                    onChange={(e) => setNewContact({...newContact, last_name: e.target.value})}
                    className="input-premium w-full"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/55 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  className="input-premium w-full"
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/55 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                  className="input-premium w-full"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newContact.email_consent}
                    onChange={(e) => setNewContact({...newContact, email_consent: e.target.checked})}
                    className="rounded border-white/20 bg-white/10 text-white focus:ring-white mr-2"
                  />
                  <span className="text-sm text-white/70">Email marketing consent</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newContact.sms_consent}
                    onChange={(e) => setNewContact({...newContact, sms_consent: e.target.checked})}
                    className="rounded border-white/20 bg-white/10 text-white focus:ring-white mr-2"
                  />
                  <span className="text-sm text-white/70">SMS marketing consent</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                disabled={!newContact.email}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Contacts Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-premium p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Import Contacts</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/55 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImportContacts(file)
                    }
                  }}
                  className="input-premium w-full"
                />
                <p className="text-xs text-white/45 mt-1">
                  CSV should include columns: first_name, last_name, email, phone
                </p>
              </div>
              
              <div className="border border-white/10 bg-white/[0.02] p-4 rounded-2xl">
                <h4 className="text-sm font-medium text-white mb-2">CSV Format Example:</h4>
                <pre className="text-xs text-white/55">
{`first_name,last_name,email,phone
John,Doe,john@example.com,+1234567890
Jane,Smith,jane@example.com,+1987654321`}
                </pre>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}
