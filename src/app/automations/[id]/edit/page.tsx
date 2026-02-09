'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import WorkflowBuilder from '@/components/automation/WorkflowBuilder'

export default function EditAutomationPage() {
  const router = useRouter()
  const params = useParams()
  const [automation, setAutomation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAutomation()
  }, [])

  const loadAutomation = async () => {
    try {
      const response = await fetch(`/api/automations/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setAutomation(data.automation)
      } else {
        alert('Failed to load automation')
        router.push('/automations')
      }
    } catch (error) {
      console.error('Failed to load automation:', error)
      alert('Failed to load automation')
      router.push('/automations')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (workflowData: any) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/automations/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      })

      if (response.ok) {
        router.push('/automations')
      } else {
        const error = await response.json()
        alert(`Failed to update automation: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to save automation:', error)
      alert('Failed to save automation')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading automation...</p>
        </div>
      </div>
    )
  }

  if (!automation) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WorkflowBuilder 
        onSave={handleSave} 
        saving={saving}
        initialData={automation}
      />
    </div>
  )
}
