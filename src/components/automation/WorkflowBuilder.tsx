'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WorkflowCanvas from './WorkflowCanvas'
import TriggerSelector from './TriggerSelector'
import ActionSelector from './ActionSelector'
import WorkflowSettings from './WorkflowSettings'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  data: any
  position: { x: number; y: number }
}

interface WorkflowBuilderProps {
  onSave: (data: any) => void
  saving?: boolean
  initialData?: any
}

export default function WorkflowBuilder({ onSave, saving, initialData }: WorkflowBuilderProps) {
  const router = useRouter()
  const [workflowName, setWorkflowName] = useState(initialData?.name || 'New Automation')
  const [workflowDescription, setWorkflowDescription] = useState(initialData?.description || '')
  const [trigger, setTrigger] = useState<any>(initialData?.trigger_config || null)
  const [triggerType, setTriggerType] = useState(initialData?.trigger_type || '')
  const [actions, setActions] = useState<any[]>(initialData?.actions || [])
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [showSettings, setShowSettings] = useState(false)
  const [stores, setStores] = useState<any[]>([])
  const [selectedStore, setSelectedStore] = useState(initialData?.store_id || '')

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
        if (data.stores.length > 0 && !selectedStore) {
          setSelectedStore(data.stores[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load stores:', error)
    }
  }

  const handleSave = () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name')
      return
    }

    if (!trigger || !triggerType) {
      alert('Please configure a trigger')
      return
    }

    if (actions.length === 0) {
      alert('Please add at least one action')
      return
    }

    if (!selectedStore) {
      alert('Please select a store')
      return
    }

    const workflowData = {
      store_id: selectedStore,
      name: workflowName,
      description: workflowDescription,
      trigger_type: triggerType,
      trigger_config: trigger,
      actions: actions,
      conditions: [],
      is_active: isActive
    }

    onSave(workflowData)
  }

  const addAction = (actionType: string) => {
    const newAction = {
      id: `action_${Date.now()}`,
      type: actionType,
      config: {},
      delay: 0
    }
    setActions([...actions, newAction])
  }

  const updateAction = (index: number, updatedAction: any) => {
    const newActions = [...actions]
    newActions[index] = updatedAction
    setActions(newActions)
  }

  const deleteAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const moveAction = (fromIndex: number, toIndex: number) => {
    const newActions = [...actions]
    const [movedAction] = newActions.splice(fromIndex, 1)
    newActions.splice(toIndex, 0, movedAction)
    setActions(newActions)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                placeholder="Workflow name"
              />
              <p className="text-sm text-gray-500 mt-1">
                {trigger ? `Trigger: ${triggerType.replace(/_/g, ' ')}` : 'No trigger configured'}
                {actions.length > 0 && ` • ${actions.length} action${actions.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-[color:var(--accent-hi)] focus:ring-[color:var(--accent-hi)] focus:ring-offset-0 checked:bg-[color:var(--accent-hi)] checked:border-[color:var(--accent-hi)]"
              />
              <span className="text-white/70">Active</span>
            </label>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-white/70 hover:bg-white/[0.04] rounded-lg transition-colors"
            >
              Settings
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save Workflow'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto">
          <WorkflowCanvas
            trigger={trigger}
            triggerType={triggerType}
            actions={actions}
            onTriggerClick={() => {}}
            onActionClick={(index) => {}}
            onActionUpdate={updateAction}
            onActionDelete={deleteAction}
            onActionMove={moveAction}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Your Workflow</h3>
            
            {/* Trigger Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">1. Choose Trigger</h4>
              <TriggerSelector
                selectedTrigger={triggerType}
                triggerConfig={trigger}
                onTriggerSelect={(type, config) => {
                  setTriggerType(type)
                  setTrigger(config)
                }}
              />
            </div>

            {/* Actions Section */}
            {trigger && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">2. Add Actions</h4>
                <ActionSelector onActionSelect={addAction} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <WorkflowSettings
          workflowName={workflowName}
          workflowDescription={workflowDescription}
          selectedStore={selectedStore}
          stores={stores}
          isActive={isActive}
          onNameChange={setWorkflowName}
          onDescriptionChange={setWorkflowDescription}
          onStoreChange={setSelectedStore}
          onActiveChange={setIsActive}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
