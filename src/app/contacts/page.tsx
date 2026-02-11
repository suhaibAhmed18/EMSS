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
import Checkbox from '@/components/ui/Checkbox'

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
  const [syncingShopify, setSyncingShopify] = useState(false)
  const [contactLimit, setContactLimit] = useState<number>(250)
  const [currentPlan, setCurrentPlan] = useState<string>('Free')
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    tags: [] as string[],
    email_consent: true,
    sms_consent: false
  })
  const [validationErrors, setValidationErrors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState({
    emailConsent: false,
    smsConsent: false,
    hasOrders: false,
    noOrders: false,
    highValue: false
  })

  const { notifications, removeNotification, showSuccess, showError } = useNotifications()

  // Load contacts on component mount
  useEffect(() => {
    loadContacts()
    loadContactLimit()
  }, [])

  const loadContactLimit = async () => {
    try {
      const response = await fetch('/api/settings/pricing')
      if (response.ok) {
        const data = await response.json()
        setCurrentPlan(data.plan || 'Free')
        
        // Import getPlanLimits dynamically
        const { getPlanLimits } = await import('@/lib/pricing/plans')
        const limits = getPlanLimits(data.plan || 'Free')
        setContactLimit(limits.contacts)
      }
    } catch (error) {
      console.error('Failed to load contact limit:', error)
    }
  }

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

    // Apply advanced filters
    let matchesFilters = true
    if (filters.emailConsent && !contact.email_consent) {
      matchesFilters = false
    }
    if (filters.smsConsent && !contact.sms_consent) {
      matchesFilters = false
    }
    if (filters.hasOrders && contact.order_count === 0) {
      matchesFilters = false
    }
    if (filters.noOrders && contact.order_count > 0) {
      matchesFilters = false
    }
    if (filters.highValue && (contact.total_spent || 0) <= 1000) {
      matchesFilters = false
    }

    return matchesSearch && matchesSegment && matchesFilters
  })

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const handleClearFilters = () => {
    setFilters({
      emailConsent: false,
      smsConsent: false,
      hasOrders: false,
      noOrders: false,
      highValue: false
    })
  }

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
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(errorData.error || 'Export failed')
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
      console.error('Export error:', err)
      showError('Export Failed', err instanceof Error ? err.message : 'Failed to export contacts')
    } finally {
      setExporting(false)
    }
  }

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'first_name':
      case 'last_name':
        if (value && !/^[a-zA-Z\s'-]+$/.test(value)) {
          return 'Only letters, spaces, hyphens, and apostrophes are allowed'
        }
        return ''
      
      case 'email':
        if (!value) {
          return 'Email is required'
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address'
        }
        return ''
      
      case 'phone':
        if (value && !/^[\d\s()+-]+$/.test(value)) {
          return 'Only numbers, spaces, parentheses, hyphens, and plus sign are allowed'
        }
        return ''
      
      default:
        return ''
    }
  }

  const handleContactFieldChange = (field: string, value: string) => {
    setNewContact({ ...newContact, [field]: value })
    const error = validateField(field, value)
    setValidationErrors({ ...validationErrors, [field]: error })
  }

  const isFormValid = (): boolean => {
    const errors = {
      first_name: validateField('first_name', newContact.first_name),
      last_name: validateField('last_name', newContact.last_name),
      email: validateField('email', newContact.email),
      phone: validateField('phone', newContact.phone)
    }
    
    setValidationErrors(errors)
    
    return !Object.values(errors).some(error => error !== '')
  }

  const handleAddContact = async () => {
    if (!isFormValid()) {
      showError('Validation Error', 'Please fix the errors in the form before submitting')
      return
    }

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContact),
      })

      const result = await response.json()

      if (!response.ok) {
        // Show the specific error message from the API
        const errorMessage = result.details || result.error || 'Failed to add contact'
        throw new Error(errorMessage)
      }
      
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
      setValidationErrors({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
      })
      setShowAddModal(false)
      
      // Show success notification
      showSuccess('Contact Added', `${result.contact.first_name} ${result.contact.last_name} has been added to your contacts.`)
    } catch (err) {
      console.error('Contact creation error:', err)
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

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }
      
      // Reload contacts after import
      await loadContacts()
      
      setShowImportModal(false)
      
      // Show detailed success message
      if (result.skipped > 0) {
        showSuccess(
          'Import Completed with Warnings', 
          `Imported ${result.imported} contact(s). ${result.skipped} skipped. ${result.errors?.length > 0 ? 'Check console for details.' : ''}`
        )
        if (result.errors?.length > 0) {
          console.warn('Import errors:', result.errors)
        }
      } else {
        showSuccess('Import Successful', `Successfully imported ${result.imported} contact(s)`)
      }
    } catch (err) {
      showError('Import Failed', err instanceof Error ? err.message : 'Failed to import contacts')
    }
  }

  const handleImportAllCSVFiles = async (files: FileList) => {
    try {
      let totalImported = 0
      let totalSkipped = 0
      let totalErrors: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Only process CSV files
        if (!file.name.toLowerCase().endsWith('.csv')) {
          continue
        }
        
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/contacts/import', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (response.ok) {
          totalImported += result.imported || 0
          totalSkipped += result.skipped || 0
          if (result.errors?.length > 0) {
            totalErrors.push(...result.errors)
          }
        } else {
          totalErrors.push(`${file.name}: ${result.error || 'Import failed'}`)
        }
      }
      
      // Reload contacts after all imports
      await loadContacts()
      
      setShowImportModal(false)
      
      // Show summary message
      if (totalErrors.length > 0) {
        showSuccess(
          'Bulk Import Completed with Warnings', 
          `Imported ${totalImported} contact(s). ${totalSkipped} skipped. ${totalErrors.length} error(s). Check console for details.`
        )
        console.warn('Import errors:', totalErrors)
      } else {
        showSuccess('Bulk Import Successful', `Successfully imported ${totalImported} contact(s) from ${files.length} file(s)`)
      }
    } catch (err) {
      showError('Bulk Import Failed', err instanceof Error ? err.message : 'Failed to import CSV files')
    }
  }

  const handleSyncFromShopify = async () => {
    try {
      setSyncingShopify(true)
      
      const response = await fetch('/api/contacts/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed')
      }
      
      // Reload contacts after sync
      await loadContacts()
      
      // Show success message
      showSuccess(
        'Shopify Sync Complete', 
        `Imported ${result.imported} new contact(s), updated ${result.updated} existing contact(s). Total: ${result.total}`
      )
    } catch (err) {
      showError('Shopify Sync Failed', err instanceof Error ? err.message : 'Failed to sync contacts from Shopify')
    } finally {
      setSyncingShopify(false)
    }
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setNewContact({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone || '',
      tags: contact.tags,
      email_consent: contact.email_consent,
      sms_consent: contact.sms_consent
    })
    setShowEditModal(true)
  }

  const handleUpdateContact = async () => {
    if (!editingContact) return
    
    if (!isFormValid()) {
      showError('Validation Error', 'Please fix the errors in the form before submitting')
      return
    }

    try {
      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContact),
      })

      if (!response.ok) {
        throw new Error('Failed to update contact')
      }

      const result = await response.json()
      
      // Update the contact in the list
      setContacts(prev => prev.map(c => 
        c.id === editingContact.id 
          ? { ...c, ...newContact, updated_at: new Date().toISOString() }
          : c
      ))
      
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
      setValidationErrors({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
      })
      setShowEditModal(false)
      setEditingContact(null)
      
      // Show success notification
      showSuccess('Contact Updated', `${newContact.first_name} ${newContact.last_name} has been updated successfully.`)
    } catch (err) {
      showError('Failed to Update Contact', err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  const handleDeleteContact = (contactId: string) => {
    setDeletingContactId(contactId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteContact = async () => {
    if (!deletingContactId) return

    try {
      const response = await fetch(`/api/contacts/${deletingContactId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete contact')
      }

      // Remove the contact from the list
      const deletedContact = contacts.find(c => c.id === deletingContactId)
      setContacts(prev => prev.filter(c => c.id !== deletingContactId))
      
      // Remove from selected contacts if it was selected
      setSelectedContacts(prev => prev.filter(id => id !== deletingContactId))
      
      // Close modal and reset state
      setShowDeleteConfirm(false)
      setDeletingContactId(null)
      
      // Show success notification
      if (deletedContact) {
        showSuccess('Contact Deleted', `${deletedContact.first_name} ${deletedContact.last_name} has been deleted.`)
      } else {
        showSuccess('Contact Deleted', 'Contact has been deleted successfully.')
      }
    } catch (err) {
      showError('Failed to Delete Contact', err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return

    try {
      // Delete all selected contacts
      const deletePromises = selectedContacts.map(contactId =>
        fetch(`/api/contacts/${contactId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      
      // Check if all deletions were successful
      const failedDeletions = results.filter(r => !r.ok)
      
      if (failedDeletions.length > 0) {
        throw new Error(`Failed to delete ${failedDeletions.length} contact(s)`)
      }

      // Remove deleted contacts from the list
      setContacts(prev => prev.filter(c => !selectedContacts.includes(c.id)))
      
      // Show success notification
      showSuccess('Contacts Deleted', `Successfully deleted ${selectedContacts.length} contact(s).`)
      
      // Clear selection
      setSelectedContacts([])
    } catch (err) {
      showError('Failed to Delete Contacts', err instanceof Error ? err.message : 'An unexpected error occurred')
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
            Import CSV
          </button>
          <button className="btn-ghost" onClick={handleSyncFromShopify} disabled={syncingShopify}>
            <Users className="w-4 h-4" />
            {syncingShopify ? 'Syncing...' : 'Import from Shopify'}
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
                <div className="flex justify-between items-center">
                  <span className="text-white/55">Contact Limit</span>
                  <span className={`font-medium ${contacts.length >= contactLimit ? 'text-red-400' : 'text-white'}`}>
                    {contacts.length.toLocaleString()} / {contactLimit === 100000 ? '∞' : contactLimit.toLocaleString()}
                  </span>
                </div>
                {contacts.length >= contactLimit && (
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-300">
                      Contact limit reached. <a href="/settings?tab=pricing" className="underline">Upgrade plan</a>
                    </p>
                  </div>
                )}
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
                    <button 
                      className="btn-ghost relative"
                      onClick={() => setShowFilterModal(true)}
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[color:var(--accent-hi)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
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
                        <button className="btn-ghost text-sm text-red-400" onClick={handleBulkDelete}>
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
                          <Checkbox
                            checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                            onChange={handleSelectAll}
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
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onChange={() => handleSelectContact(contact.id)}
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
                              <button 
                                onClick={() => handleEditContact(contact)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                                title="Edit contact"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteContact(contact.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15 transition-colors"
                                title="Delete contact"
                              >
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
                    onChange={(e) => handleContactFieldChange('first_name', e.target.value)}
                    className={`input-premium w-full ${validationErrors.first_name ? 'border-red-400' : ''}`}
                    placeholder="John"
                  />
                  {validationErrors.first_name && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/55 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newContact.last_name}
                    onChange={(e) => handleContactFieldChange('last_name', e.target.value)}
                    className={`input-premium w-full ${validationErrors.last_name ? 'border-red-400' : ''}`}
                    placeholder="Doe"
                  />
                  {validationErrors.last_name && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors.last_name}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/55 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => handleContactFieldChange('email', e.target.value)}
                  className={`input-premium w-full ${validationErrors.email ? 'border-red-400' : ''}`}
                  placeholder="john@example.com"
                  required
                />
                {validationErrors.email && (
                  <p className="text-xs text-red-400 mt-1">{validationErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/55 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newContact.phone}
                  onChange={(e) => handleContactFieldChange('phone', e.target.value)}
                  onKeyDown={(e) => {
                    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
                    if ([8, 9, 27, 13, 46, 37, 38, 39, 40, 36, 35].includes(e.keyCode) ||
                        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true)) {
                      return
                    }
                    // Ensure that it is a number, space, parentheses, hyphen, or plus sign
                    if (!/[\d\s()+-]/.test(e.key)) {
                      e.preventDefault()
                    }
                  }}
                  className={`input-premium w-full ${validationErrors.phone ? 'border-red-400' : ''}`}
                  placeholder="+1 (555) 123-4567"
                />
                {validationErrors.phone && (
                  <p className="text-xs text-red-400 mt-1">{validationErrors.phone}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Checkbox
                  label="Email marketing consent"
                  checked={newContact.email_consent}
                  onChange={(e) => setNewContact({...newContact, email_consent: e.target.checked})}
                />
                
                <Checkbox
                  label="SMS marketing consent"
                  checked={newContact.sms_consent}
                  onChange={(e) => setNewContact({...newContact, sms_consent: e.target.checked})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setValidationErrors({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: ''
                  })
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                disabled={!newContact.email || Object.values(validationErrors).some(error => error !== '')}
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
                  Import CSV Files
                </label>
                <input
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files
                    if (files && files.length > 0) {
                      handleImportAllCSVFiles(files)
                    }
                  }}
                  className="input-premium w-full"
                />
                <p className="text-xs text-white/45 mt-1">
                  Select multiple CSV files to import all at once
                </p>
              </div>
              
              <div className="border border-white/10 bg-white/[0.02] p-4 rounded-2xl">
                <h4 className="text-sm font-medium text-white mb-2">CSV Format Example:</h4>
                <pre className="text-xs text-white/55 overflow-x-auto whitespace-pre-wrap break-all">
{`email,first_name,last_name,phone,tags,email_consent,sms_consent,total_spent,order_count
john@example.com,John,Doe,+1234567890,vip;customer,yes,yes,150.00,3
jane@example.com,Jane,Smith,+1987654321,customer,yes,no,75.50,1`}
                </pre>
                <p className="text-xs text-white/45 mt-2">
                  Note: Only email is required. Tags should be separated by semicolons.
                </p>
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

      {/* Edit Contact Modal */}
      {showEditModal && editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-premium p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Contact</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/55 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newContact.first_name}
                    onChange={(e) => handleContactFieldChange('first_name', e.target.value)}
                    className={`input-premium w-full ${validationErrors.first_name ? 'border-red-400' : ''}`}
                    placeholder="John"
                  />
                  {validationErrors.first_name && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/55 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newContact.last_name}
                    onChange={(e) => handleContactFieldChange('last_name', e.target.value)}
                    className={`input-premium w-full ${validationErrors.last_name ? 'border-red-400' : ''}`}
                    placeholder="Doe"
                  />
                  {validationErrors.last_name && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors.last_name}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/55 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => handleContactFieldChange('email', e.target.value)}
                  className={`input-premium w-full ${validationErrors.email ? 'border-red-400' : ''}`}
                  placeholder="john@example.com"
                  required
                />
                {validationErrors.email && (
                  <p className="text-xs text-red-400 mt-1">{validationErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/55 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newContact.phone}
                  onChange={(e) => handleContactFieldChange('phone', e.target.value)}
                  onKeyDown={(e) => {
                    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
                    if ([8, 9, 27, 13, 46, 37, 38, 39, 40, 36, 35].includes(e.keyCode) ||
                        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true)) {
                      return
                    }
                    // Ensure that it is a number, space, parentheses, hyphen, or plus sign
                    if (!/[\d\s()+-]/.test(e.key)) {
                      e.preventDefault()
                    }
                  }}
                  className={`input-premium w-full ${validationErrors.phone ? 'border-red-400' : ''}`}
                  placeholder="+1 (555) 123-4567"
                />
                {validationErrors.phone && (
                  <p className="text-xs text-red-400 mt-1">{validationErrors.phone}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Checkbox
                  label="Email marketing consent"
                  checked={newContact.email_consent}
                  onChange={(e) => setNewContact({...newContact, email_consent: e.target.checked})}
                />
                
                <Checkbox
                  label="SMS marketing consent"
                  checked={newContact.sms_consent}
                  onChange={(e) => setNewContact({...newContact, sms_consent: e.target.checked})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingContact(null)
                  setValidationErrors({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: ''
                  })
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateContact}
                disabled={!newContact.email || Object.values(validationErrors).some(error => error !== '')}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingContactId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-premium p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Contact</h3>
            
            <p className="text-white/70 mb-6">
              Are you sure you want to delete this contact? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletingContactId(null)
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteContact}
                className="btn-primary bg-red-500 hover:bg-red-600 border-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-premium p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Filter Contacts</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-white/55 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-white/70 mb-3">Consent Status</h4>
                <div className="space-y-2">
                  <Checkbox
                    label="Email consent only"
                    checked={filters.emailConsent}
                    onChange={(e) => setFilters({...filters, emailConsent: e.target.checked})}
                  />
                  <Checkbox
                    label="SMS consent only"
                    checked={filters.smsConsent}
                    onChange={(e) => setFilters({...filters, smsConsent: e.target.checked})}
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-medium text-white/70 mb-3">Order History</h4>
                <div className="space-y-2">
                  <Checkbox
                    label="Has placed orders"
                    checked={filters.hasOrders}
                    onChange={(e) => setFilters({...filters, hasOrders: e.target.checked, noOrders: e.target.checked ? false : filters.noOrders})}
                  />
                  <Checkbox
                    label="No orders yet"
                    checked={filters.noOrders}
                    onChange={(e) => setFilters({...filters, noOrders: e.target.checked, hasOrders: e.target.checked ? false : filters.hasOrders})}
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-medium text-white/70 mb-3">Customer Value</h4>
                <div className="space-y-2">
                  <Checkbox
                    label="High value (>$1000 spent)"
                    checked={filters.highValue}
                    onChange={(e) => setFilters({...filters, highValue: e.target.checked})}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowFilterModal(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="btn-primary"
              >
                Apply Filters
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
