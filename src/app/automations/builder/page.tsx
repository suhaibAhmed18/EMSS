'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import WorkflowBuilderCanvas from '@/components/automation/WorkflowBuilderCanvas'

function BuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const automationId = searchParams.get('id')
  
  const [workflowName, setWorkflowName] = useState('Custom Workflow')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [workflowData, setWorkflowData] = useState<any>(null)

  useEffect(() => {
    if (automationId) {
      loadAutomation()
    } else if (templateId) {
      loadTemplate()
    }
  }, [automationId, templateId])

  const loadAutomation = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/automations/${automationId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflowData(data.automation)
        setWorkflowName(data.automation.name)
      }
    } catch (error) {
      console.error('Failed to load automation:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = () => {
    // Load template data based on templateId
    const templates: Record<string, any> = {
      'welcome': {
        name: 'Welcome Series',
        trigger_type: 'customer_created',
        trigger_config: { description: 'When a new customer signs up' },
        actions: [
          {
            id: 'action_1',
            type: 'send_email',
            config: {
              subject: 'Welcome to our store!',
              body: 'Hi {customer_name}, thanks for signing up!'
            },
            delay: 0
          }
        ]
      },
      'cart-abandonment': {
        name: 'Abandoned Cart Recovery',
        trigger_type: 'cart_abandoned',
        trigger_config: { delay_minutes: 60 },
        actions: [
          {
            id: 'action_1',
            type: 'send_email',
            config: {
              subject: 'You left something behind!',
              body: 'Complete your order and get 10% off!'
            },
            delay: 0
          },
          {
            id: 'action_2',
            type: 'delay',
            config: {},
            delay: 1440
          },
          {
            id: 'action_3',
            type: 'send_email',
            config: {
              subject: 'Last chance - Your cart expires soon',
              body: 'Don\'t miss out on your items!'
            },
            delay: 0
          }
        ]
      }
    }

    const template = templates[templateId || ''] || templates['welcome']
    setWorkflowData(template)
    setWorkflowName(template.name)
  }

  const handleSave = async (data: any) => {
    setSaving(true)
    try {
      const url = automationId 
        ? `/api/automations/${automationId}`
        : '/api/automations'
      
      const method = automationId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        router.push('/automations')
      } else {
        const error = await response.json()
        alert(`Failed to save automation: ${error.error}`)
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
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent-hi)] mx-auto"></div>
          <p className="mt-4 text-white/60">Loading workflow...</p>
        </div>
      </div>
    )
  }

  return (
    <WorkflowBuilderCanvas
      initialData={workflowData}
      initialName={workflowName}
      onSave={handleSave}
      saving={saving}
    />
  )
}

export default function AutomationBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent-hi)]"></div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  )
}
