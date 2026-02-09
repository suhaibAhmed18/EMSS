'use client'

interface ActionOption {
  type: string
  label: string
  description: string
  icon: string
}

const ACTION_OPTIONS: ActionOption[] = [
  {
    type: 'send_email',
    label: 'Send Email',
    description: 'Send an email to the customer',
    icon: '📧'
  },
  {
    type: 'send_sms',
    label: 'Send SMS',
    description: 'Send a text message',
    icon: '💬'
  },
  {
    type: 'delay',
    label: 'Wait',
    description: 'Add a delay before next action',
    icon: '⏱️'
  },
  {
    type: 'add_tag',
    label: 'Add Tag',
    description: 'Tag the contact',
    icon: '🏷️'
  },
  {
    type: 'update_contact',
    label: 'Update Contact',
    description: 'Update contact properties',
    icon: '✏️'
  }
]

interface ActionSelectorProps {
  onActionSelect: (type: string) => void
}

export default function ActionSelector({ onActionSelect }: ActionSelectorProps) {
  return (
    <div className="space-y-2">
      {ACTION_OPTIONS.map(action => (
        <button
          key={action.type}
          onClick={() => onActionSelect(action.type)}
          className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all bg-white"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{action.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{action.label}</div>
              <div className="text-sm text-gray-600 mt-1">{action.description}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  )
}
