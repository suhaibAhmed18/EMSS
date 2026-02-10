'use client'

import { useState, useEffect } from 'react'
import SettingsSidebar from '@/components/settings/SettingsSidebar'
import ProfileInformation from '@/components/settings/ProfileInformation'
import PricingAndUsage from '@/components/settings/PricingAndUsage'
import DomainsSettings from '@/components/settings/DomainsSettings'
import EmailAddressesSettings from '@/components/settings/EmailAddressesSettings'
import SmsSettings from '@/components/settings/SmsSettings'
import SavedTemplates from '@/components/settings/SavedTemplates'
import StoreInformation from '@/components/settings/StoreInformation'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationSystem from '@/components/notifications/NotificationSystem'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { notifications, removeNotification } = useNotifications()

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileInformation />
      case 'pricing':
        return <PricingAndUsage />
      case 'store-info':
        return <StoreInformation />
      case 'domains':
        return <DomainsSettings />
      case 'email':
        return <EmailAddressesSettings />
      case 'sms':
        return <SmsSettings />
      case 'templates':
        return <SavedTemplates />
      default:
        return <ProfileInformation />
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Store settings</h1>
          <p className="text-white/60 text-sm">Manage your store configuration and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>

      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}
