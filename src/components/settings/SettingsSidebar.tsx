'use client'

import { DollarSign, Globe, Mail, MessageSquare, FileText, Info, User } from 'lucide-react'

interface SettingsSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const settingsTabs = [
  { id: 'profile', name: 'Profile information', icon: User },
  { id: 'pricing', name: 'Pricing and usage', icon: DollarSign },
  { id: 'store-info', name: 'Store information', icon: Info },
  { id: 'domains', name: 'Domains', icon: Globe },
  { id: 'email', name: 'Email addresses', icon: Mail },
  { id: 'sms', name: 'SMS', icon: MessageSquare },
  { id: 'templates', name: 'Saved templates', icon: FileText },
]

export default function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <div className="card-premium p-4">
      <nav className="space-y-1">
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center px-3 py-2.5 text-sm text-left rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="truncate">{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
