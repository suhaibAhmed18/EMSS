'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WorkflowBuilder from '@/components/automation/WorkflowBuilder'

export default function NewAutomationPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = async (workflowData: any) => {
    setSaving(true)
    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      })

      if (response.ok) {
        router.push('/automations')
      } else {
        const error = await response.json()
        alert(`Failed to create automation: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to save automation:', error)
      alert('Failed to save automation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WorkflowBuilder onSave={handleSave} saving={saving} />
    </div>
  )
}
