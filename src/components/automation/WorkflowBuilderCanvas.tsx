'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Mail, MessageSquare, Bell, Clock, Tag, GitBranch, 
  Plus, Settings, Save, ArrowLeft, MoreVertical, Zap
} from 'lucide-react'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'email' | 'sms' | 'push' | 'delay' | 'tag' | 'split'
  data: any
  position: { x: number; y: number }
}

interface WorkflowBuilderCanvasProps {
  initialData?: any
  initialName?: string
  onSave: (data: any) => void
  saving?: boolean
}

export default function WorkflowBuilderCanvas({
  initialData,
  initialName = 'Custom Workflow',
  onSave,
  saving
}: WorkflowBuilderCanvasProps) {
  const router = useRouter()
  const [workflowName, setWorkflowName] = useState(initialName)
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [showTriggerPanel, setShowTriggerPanel] = useState(false)
  const [stores, setStores] = useState<any[]>([])
  const [selectedStore, setSelectedStore] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    loadStores()
    if (initialData) {
      loadWorkflowData(initialData)
    } else {
      // Initialize with empty trigger - centered
      setNodes([{
        id: 'trigger',
        type: 'trigger',
        data: { event: null },
        position: { x: 0, y: 50 }
      }])
      setShowTriggerPanel(true)
    }
  }, [initialData])

  const loadStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
        // Auto-select first store if none selected and not loading existing automation
        if (data.stores.length > 0 && !selectedStore && !initialData) {
          setSelectedStore(data.stores[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load stores:', error)
    }
  }

  const loadWorkflowData = (data: any) => {
    const loadedNodes: WorkflowNode[] = []
    
    // Add trigger node - centered
    loadedNodes.push({
      id: 'trigger',
      type: 'trigger',
      data: {
        event: data.trigger_type,
        config: data.trigger_config
      },
      position: { x: 0, y: 50 }
    })

    // Add action nodes - centered
    if (data.actions) {
      data.actions.forEach((action: any, index: number) => {
        loadedNodes.push({
          id: action.id || `action_${index}`,
          type: action.type === 'send_email' ? 'email' : 
                action.type === 'send_sms' ? 'sms' :
                action.type === 'delay' ? 'delay' :
                action.type === 'add_tag' ? 'tag' : 'email',
          data: action.config,
          position: { x: 0, y: 150 + (index * 120) }
        })
      })
    }

    setNodes(loadedNodes)
    setSelectedStore(data.store_id || '')
    setIsActive(data.is_active ?? true)
  }

  const addNode = (type: WorkflowNode['type']) => {
    const lastNode = nodes[nodes.length - 1]
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      data: {},
      position: { 
        x: 0, 
        y: lastNode ? lastNode.position.y + 120 : 150 
      }
    }
    setNodes([...nodes, newNode])
    setSelectedNode(newNode)
  }

  const updateNode = (nodeId: string, data: any) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, data } : node
    ))
  }

  const deleteNode = (nodeId: string) => {
    if (nodeId === 'trigger') return
    setNodes(nodes.filter(node => node.id !== nodeId))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const handleSave = () => {
    const triggerNode = nodes.find(n => n.type === 'trigger')
    if (!triggerNode || !triggerNode.data.event) {
      alert('Please configure a trigger')
      return
    }

    const actionNodes = nodes.filter(n => n.type !== 'trigger')
    if (actionNodes.length === 0) {
      alert('Please add at least one action')
      return
    }

    if (!selectedStore) {
      alert('Please select a store')
      return
    }

    // Build trigger config with workflow settings
    const triggerConfig = {
      ...(triggerNode.data.config || {}),
      send_to_subscribed_only: triggerNode.data.send_to_subscribed_only !== false, // Default to true
      respect_quiet_hours: triggerNode.data.respect_quiet_hours || false,
      exit_condition: triggerNode.data.exit_condition || null,
      filters: triggerNode.data.filters || []
    }

    const workflowData = {
      store_id: selectedStore,
      name: workflowName,
      description: '',
      trigger_type: triggerNode.data.event,
      trigger_config: triggerConfig,
      actions: actionNodes.map(node => ({
        id: node.id,
        type: node.type === 'email' ? 'send_email' :
              node.type === 'sms' ? 'send_sms' :
              node.type === 'delay' ? 'delay' :
              node.type === 'tag' ? 'add_tag' : node.type,
        config: node.data,
        delay: node.data.delay || 0
      })),
      conditions: [],
      is_active: isActive
    }

    onSave(workflowData)
  }

  const handleStartWorkflow = () => {
    const triggerNode = nodes.find(n => n.type === 'trigger')
    if (!triggerNode || !triggerNode.data.event) {
      alert('Please configure a trigger before starting the workflow')
      return
    }

    const actionNodes = nodes.filter(n => n.type !== 'trigger')
    if (actionNodes.length === 0) {
      alert('Please add at least one action before starting the workflow')
      return
    }

    if (!selectedStore) {
      alert('Please select a store')
      return
    }

    // Set workflow as active and save
    setIsActive(true)
    
    // Build trigger config with workflow settings
    const triggerConfig = {
      ...(triggerNode.data.config || {}),
      send_to_subscribed_only: triggerNode.data.send_to_subscribed_only !== false, // Default to true
      respect_quiet_hours: triggerNode.data.respect_quiet_hours || false,
      exit_condition: triggerNode.data.exit_condition || null,
      filters: triggerNode.data.filters || []
    }

    const workflowData = {
      store_id: selectedStore,
      name: workflowName,
      description: '',
      trigger_type: triggerNode.data.event,
      trigger_config: triggerConfig,
      actions: actionNodes.map(node => ({
        id: node.id,
        type: node.type === 'email' ? 'send_email' :
              node.type === 'sms' ? 'send_sms' :
              node.type === 'delay' ? 'delay' :
              node.type === 'tag' ? 'add_tag' : node.type,
        config: node.data,
        delay: node.data.delay || 0
      })),
      conditions: [],
      is_active: true
    }

    onSave(workflowData)
  }

  const renderNode = (node: WorkflowNode) => {
    const isSelected = selectedNode?.id === node.id
    
    const getNodeIcon = () => {
      switch (node.type) {
        case 'trigger': return '⚡'
        case 'email': return <Mail className="w-5 h-5" />
        case 'sms': return <MessageSquare className="w-5 h-5" />
        case 'push': return <Bell className="w-5 h-5" />
        case 'delay': return <Clock className="w-5 h-5" />
        case 'tag': return <Tag className="w-5 h-5" />
        case 'split': return <GitBranch className="w-5 h-5" />
        default: return <Mail className="w-5 h-5" />
      }
    }

    const getNodeTitle = () => {
      switch (node.type) {
        case 'trigger':
          if (!node.data.event) return 'Select trigger'
          const eventName = node.data.event.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          const filterCount = node.data.filters?.length || 0
          return filterCount > 0 ? `${eventName} (${filterCount} filter${filterCount > 1 ? 's' : ''})` : eventName
        case 'email':
          return node.data.subject || 'Email'
        case 'sms':
          return 'SMS Message'
        case 'push':
          return 'Push Notification'
        case 'delay':
          return `Wait ${node.data.delay || 0} minutes`
        case 'tag':
          return `Tag: ${node.data.tag || 'contact'}`
        case 'split':
          return 'Conditional Split'
        default:
          return 'Action'
      }
    }

    return (
      <div
        key={node.id}
        className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'border-[color:var(--accent-hi)] shadow-lg' : 'border-white/10'
        } ${node.type === 'trigger' ? 'border-blue-400/50 bg-blue-400/5' : 'bg-white/[0.03]'}`}
        style={{
          position: 'absolute',
          top: node.position.y,
          left: 0,
          right: 0
        }}
        onClick={() => setSelectedNode(node)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            node.type === 'trigger' ? 'bg-blue-400/20 text-blue-300' : 'bg-white/[0.06] text-white/70'
          }`}>
            {getNodeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/55 uppercase mb-1 tracking-wider">
              {node.type === 'trigger' ? 'Trigger' : 'Action'}
            </div>
            <div className="font-semibold text-white truncate">
              {getNodeTitle()}
            </div>
            {node.type === 'trigger' && node.data.event && (
              <div className="mt-2 space-y-1">
                {node.data.exit_condition && (
                  <div className="text-xs text-white/50">
                    Exit: {node.data.exit_condition.replace(/_/g, ' ')}
                  </div>
                )}
                {node.data.send_to_subscribed_only !== false && (
                  <div className="text-xs text-emerald-300/70">
                    ✓ Subscribed contacts only
                  </div>
                )}
              </div>
            )}
          </div>
          {node.type !== 'trigger' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteNode(node.id)
              }}
              className="text-white/40 hover:text-red-400"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {node.type === 'trigger' && !node.data.event && (
          <div className="mt-2 text-sm text-white/50">
            Click to configure trigger
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col app-background">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/[0.03] backdrop-blur-md px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-xl font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-hi)] rounded px-2 py-1"
                placeholder="Workflow name"
              />
              {stores.length > 0 && (
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="input-premium text-sm py-2"
                >
                  <option value="">Select store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-[color:var(--accent-hi)] focus:ring-[color:var(--accent-hi)]"
              />
              <span>Active</span>
            </label>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-secondary"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save & close'}
            </button>
            <button 
              onClick={handleStartWorkflow}
              disabled={saving}
              className="btn-primary"
            >
              <Zap className="w-4 h-4" />
              {saving ? 'Starting...' : 'Start workflow'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Message Types */}
        <div className="w-64 border-r border-white/10 bg-white/[0.02] p-4 overflow-y-auto scrollbar-premium">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-white/55 uppercase mb-3 tracking-wider">Messages</h3>
            <div className="space-y-2">
              <button
                onClick={() => addNode('email')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-[color:var(--accent-hi)] hover:bg-white/[0.04] transition-all text-left"
              >
                <Mail className="w-5 h-5 text-white/70" />
                <span className="text-sm font-medium text-white">Email</span>
              </button>
              <button
                onClick={() => addNode('sms')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-[color:var(--accent-hi)] hover:bg-white/[0.04] transition-all text-left"
              >
                <MessageSquare className="w-5 h-5 text-white/70" />
                <span className="text-sm font-medium text-white">SMS</span>
              </button>
              <button
                onClick={() => addNode('push')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-[color:var(--accent-hi)] hover:bg-white/[0.04] transition-all text-left"
              >
                <Bell className="w-5 h-5 text-white/70" />
                <span className="text-sm font-medium text-white">Push notification</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/55 uppercase mb-3 tracking-wider">Flow Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => addNode('delay')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-[color:var(--accent-hi)] hover:bg-white/[0.04] transition-all text-left"
              >
                <Clock className="w-5 h-5 text-white/70" />
                <span className="text-sm font-medium text-white">Delay</span>
              </button>
              <button
                onClick={() => addNode('tag')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-[color:var(--accent-hi)] hover:bg-white/[0.04] transition-all text-left"
              >
                <Tag className="w-5 h-5 text-white/70" />
                <span className="text-sm font-medium text-white">Tag contact</span>
              </button>
              <button
                onClick={() => addNode('split')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-[color:var(--accent-hi)] hover:bg-white/[0.04] transition-all text-left"
              >
                <GitBranch className="w-5 h-5 text-white/70" />
                <span className="text-sm font-medium text-white">Split</span>
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto relative">
          <div className="min-h-full w-full flex justify-center p-8">
            <div className="relative" style={{ width: '600px', minHeight: nodes.length > 0 ? `${nodes[nodes.length - 1].position.y + 200}px` : '400px' }}>
              {/* Nodes */}
              <div className="relative" style={{ zIndex: 1 }}>
                {nodes.map(node => renderNode(node))}
              </div>

              {/* Connection Lines */}
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, width: '100%', height: '100%' }}>
                {nodes.map((node, index) => {
                  if (index === 0) return null
                  const prevNode = nodes[index - 1]
                  // Calculate approximate box height (padding + content)
                  const boxHeight = 80
                  return (
                    <line
                      key={`line-${node.id}`}
                      x1="300"
                      y1={prevNode.position.y + boxHeight}
                      x2="300"
                      y2={node.position.y}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )
                })}
              </svg>

              {/* Add Node Button */}
              {nodes.length > 0 && (
                <button
                  onClick={() => addNode('email')}
                  className="w-full border-2 border-dashed border-white/20 rounded-xl p-6 hover:border-[color:var(--accent-hi)] hover:bg-white/[0.02] transition-all absolute"
                  style={{
                    top: nodes[nodes.length - 1].position.y + 100
                  }}
                >
                  <div className="flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add action</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Node Editor */}
        {selectedNode && (
          <div className="w-96 border-l border-white/10 bg-white/[0.02] p-6 overflow-y-auto scrollbar-premium">
            <NodeEditor
              node={selectedNode}
              onUpdate={(data) => updateNode(selectedNode.id, data)}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Node Editor Component
function NodeEditor({ node, onUpdate, onClose }: any) {
  const [data, setData] = useState(node.data)

  const handleChange = (key: string, value: any) => {
    const newData = { ...data, [key]: value }
    setData(newData)
    onUpdate(newData)
  }

  const handleFilterChange = (index: number, field: string, value: any) => {
    const filters = [...(data.filters || [])]
    filters[index] = { ...filters[index], [field]: value }
    handleChange('filters', filters)
  }

  const addFilter = () => {
    const filters = [...(data.filters || [])]
    filters.push({ field: '', operator: 'equals', value: '' })
    handleChange('filters', filters)
  }

  const removeFilter = (index: number) => {
    const filters = [...(data.filters || [])]
    filters.splice(index, 1)
    handleChange('filters', filters)
  }

  if (node.type === 'trigger') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Edit trigger</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-6">
          {/* Trigger Event */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Trigger Event</label>
            <select
              value={data.event || ''}
              onChange={(e) => handleChange('event', e.target.value)}
              className="input-premium w-full"
            >
              <option value="">Please select event</option>
              <optgroup label="Order Events">
                <option value="order_refunded">Order refunded</option>
                <option value="ordered_product">Ordered product</option>
                <option value="paid_for_order">Paid for order</option>
                <option value="placed_order">Placed order</option>
                <option value="order_canceled">Order canceled</option>
                <option value="order_fulfilled">Order fulfilled</option>
              </optgroup>
              <optgroup label="Product Events">
                <option value="product_back_in_stock">Product back in stock</option>
                <option value="viewed_product">Viewed product</option>
              </optgroup>
              <optgroup label="Customer Events">
                <option value="customer_created">New Customer</option>
                <option value="customer_subscribed">Subscribed to Marketing</option>
                <option value="special_occasion_birthday">Special occasion (Birthday)</option>
              </optgroup>
              <optgroup label="Cart & Checkout Events">
                <option value="cart_abandoned">Cart Abandoned</option>
                <option value="started_checkout">Started checkout</option>
              </optgroup>
              <optgroup label="Engagement Events">
                <option value="viewed_page">Viewed page</option>
                <option value="clicked_message">Clicked message</option>
                <option value="opened_message">Opened message</option>
                <option value="message_sent">Message sent</option>
                <option value="message_delivery_failed">Message delivery failed</option>
                <option value="marked_message_as_spam">Marked message as spam</option>
              </optgroup>
              <optgroup label="Segment Events">
                <option value="entered_segment">Entered segment</option>
                <option value="exited_segment">Exited segment</option>
              </optgroup>
            </select>
          </div>

          {/* Entry Condition */}
          {data.event && (
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-white mb-3">Entry Condition</h4>
              <p className="text-sm text-white/60">
                {data.event === 'customer_subscribed' && 'Customers enter the workflow when they subscribe to marketing'}
                {data.event === 'customer_created' && 'Customers enter the workflow when they sign up'}
                {data.event === 'cart_abandoned' && 'Customers enter the workflow when they abandon their cart'}
                {data.event === 'order_created' && 'Customers enter the workflow when they place an order'}
                {data.event === 'order_paid' && 'Customers enter the workflow when payment is confirmed'}
                {data.event === 'order_refunded' && 'Customers enter the workflow when their order is refunded'}
                {data.event === 'ordered_product' && 'Customers enter the workflow when they order a specific product'}
                {data.event === 'paid_for_order' && 'Customers enter the workflow when they complete payment for an order'}
                {data.event === 'placed_order' && 'Customers enter the workflow when they place an order'}
                {data.event === 'product_back_in_stock' && 'Customers enter the workflow when a product is back in stock'}
                {data.event === 'special_occasion_birthday' && 'Customers enter the workflow on their birthday'}
                {data.event === 'started_checkout' && 'Customers enter the workflow when they start the checkout process'}
                {data.event === 'viewed_page' && 'Customers enter the workflow when they view a specific page'}
                {data.event === 'viewed_product' && 'Customers enter the workflow when they view a specific product'}
                {data.event === 'clicked_message' && 'Customers enter the workflow when they click a link in a message'}
                {data.event === 'entered_segment' && 'Customers enter the workflow when they join a specific segment'}
                {data.event === 'exited_segment' && 'Customers enter the workflow when they leave a specific segment'}
                {data.event === 'marked_message_as_spam' && 'Customers enter the workflow when they mark a message as spam'}
                {data.event === 'message_delivery_failed' && 'Customers enter the workflow when message delivery fails'}
                {data.event === 'message_sent' && 'Customers enter the workflow when a message is sent to them'}
                {data.event === 'opened_message' && 'Customers enter the workflow when they open a message'}
                {data.event === 'order_canceled' && 'Customers enter the workflow when their order is canceled'}
                {data.event === 'order_fulfilled' && 'Customers enter the workflow when their order is fulfilled'}
              </p>
            </div>
          )}

          {/* Exit Condition */}
          {data.event && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Exit Condition</label>
              <select
                value={data.exit_condition || ''}
                onChange={(e) => handleChange('exit_condition', e.target.value)}
                className="input-premium w-full"
              >
                <option value="">No exit condition</option>
                <option value="order_placed">Customer places an order</option>
                <option value="unsubscribed">Customer unsubscribes</option>
                <option value="tag_added">Specific tag is added</option>
              </select>
              {data.exit_condition && (
                <p className="text-xs text-white/50 mt-2">
                  Customers will exit the workflow when this condition is met
                </p>
              )}
            </div>
          )}

          {/* Trigger Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-white/70">Trigger Filters</label>
              <button
                onClick={addFilter}
                className="text-xs text-[color:var(--accent-hi)] hover:text-white"
              >
                + Add Filter
              </button>
            </div>
            
            {(!data.filters || data.filters.length === 0) ? (
              <div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-sm text-white/50">No filters added</p>
                <p className="text-xs text-white/40 mt-1">Click "Add Filter" to add conditions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.filters.map((filter: any, index: number) => (
                  <div key={index} className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 space-y-2">
                        <select
                          value={filter.field || ''}
                          onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                          className="input-premium w-full text-sm"
                        >
                          <option value="">Select field</option>
                          <option value="channel">Channel subscribed to</option>
                          <option value="subscription_method">Subscription method</option>
                          <option value="first_subscription">First subscription</option>
                          <option value="customer_tag">Customer tag</option>
                          <option value="order_count">Order count</option>
                          <option value="total_spent">Total spent</option>
                        </select>
                        
                        {filter.field && (
                          <>
                            <select
                              value={filter.operator || 'equals'}
                              onChange={(e) => handleFilterChange(index, 'operator', e.target.value)}
                              className="input-premium w-full text-sm"
                            >
                              <option value="equals">is</option>
                              <option value="not_equals">is not</option>
                              <option value="contains">contains</option>
                              <option value="greater_than">greater than</option>
                              <option value="less_than">less than</option>
                            </select>
                            
                            {filter.field === 'channel' ? (
                              <select
                                value={filter.value || ''}
                                onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                                className="input-premium w-full text-sm"
                              >
                                <option value="">Select channel</option>
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                              </select>
                            ) : filter.field === 'subscription_method' ? (
                              <select
                                value={filter.value || ''}
                                onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                                className="input-premium w-full text-sm"
                              >
                                <option value="">Select method</option>
                                <option value="signup_form">Signup form</option>
                                <option value="checkout">Checkout</option>
                                <option value="import">Import</option>
                                <option value="api">API</option>
                              </select>
                            ) : filter.field === 'first_subscription' ? (
                              <select
                                value={filter.value || ''}
                                onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                                className="input-premium w-full text-sm"
                              >
                                <option value="">Select value</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={filter.value || ''}
                                onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                                className="input-premium w-full text-sm"
                                placeholder="Enter value"
                              />
                            )}
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => removeFilter(index)}
                        className="text-red-400 hover:text-red-300 mt-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workflow Channel Settings */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">Workflow Channel Settings</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
                <input
                  type="checkbox"
                  checked={data.send_to_subscribed_only !== false}
                  onChange={(e) => handleChange('send_to_subscribed_only', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-[color:var(--accent-hi)] focus:ring-[color:var(--accent-hi)]"
                />
                <div className="flex-1">
                  <div className="text-sm text-white">Send to subscribed contacts only</div>
                  <div className="text-xs text-white/50">Email will be sent to subscribed contacts</div>
                </div>
              </label>
              
              <label className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
                <input
                  type="checkbox"
                  checked={data.respect_quiet_hours || false}
                  onChange={(e) => handleChange('respect_quiet_hours', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-[color:var(--accent-hi)] focus:ring-[color:var(--accent-hi)]"
                />
                <div className="flex-1">
                  <div className="text-sm text-white">Respect quiet hours</div>
                  <div className="text-xs text-white/50">Don't send during quiet hours</div>
                </div>
              </label>
            </div>
          </div>

          {/* Cart Abandoned Specific */}
          {data.event === 'cart_abandoned' && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Wait time before triggering (minutes)
              </label>
              <input
                type="number"
                value={data.config?.delay_minutes || 60}
                onChange={(e) => handleChange('config', { delay_minutes: parseInt(e.target.value) })}
                className="input-premium w-full"
                min="1"
              />
              <p className="text-xs text-white/50 mt-1">
                Wait this long after cart abandonment before starting the workflow
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (node.type === 'email') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Edit email</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Subject</label>
            <input
              type="text"
              value={data.subject || ''}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="input-premium w-full"
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Body</label>
            <textarea
              value={data.body || ''}
              onChange={(e) => handleChange('body', e.target.value)}
              rows={8}
              className="input-premium w-full"
              placeholder="Email content..."
            />
          </div>
        </div>
      </div>
    )
  }

  if (node.type === 'sms') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Edit SMS</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Message</label>
            <textarea
              value={data.message || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={4}
              maxLength={160}
              className="input-premium w-full"
              placeholder="SMS message..."
            />
            <p className="text-xs text-white/50 mt-1">{(data.message || '').length}/160</p>
          </div>
        </div>
      </div>
    )
  }

  if (node.type === 'delay') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Edit delay</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={data.delay || 0}
              onChange={(e) => handleChange('delay', parseInt(e.target.value))}
              className="input-premium w-full"
              min="1"
            />
          </div>
        </div>
      </div>
    )
  }

  if (node.type === 'tag') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Tag contact</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Tag name</label>
            <input
              type="text"
              value={data.tag || ''}
              onChange={(e) => handleChange('tag', e.target.value)}
              className="input-premium w-full"
              placeholder="e.g., vip-customer"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Edit action</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">×</button>
      </div>
      <p className="text-white/60">Configuration for this action type is not yet available.</p>
    </div>
  )
}
