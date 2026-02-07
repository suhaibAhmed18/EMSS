'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth/session'
import CampaignBuilderWrapper from '@/components/campaigns/CampaignBuilderWrapper'
import { Loader2 } from 'lucide-react'

function CampaignCreateContent() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignType = (searchParams.get('type') as 'email' | 'sms') || 'email'

  const handleSave = async (campaignData: any, status: 'draft' | 'scheduled' | 'send') => {
    try {
      // In real implementation, this would call the campaign service
      console.log('Saving campaign:', { ...campaignData, status })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      router.push('/campaigns')
    } catch (error) {
      console.error('Failed to save campaign:', error)
      throw error
    }
  }

  const handlePreview = () => {
    console.log('Preview campaign')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent-hi)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CampaignBuilderWrapper
        type={campaignType}
        onSave={handleSave}
        onPreview={handlePreview}
      />
    </div>
  )
}


export default function CreateCampaignPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-[color:var(--accent-hi)]" />
      </div>
    }>
      <CampaignCreateContent />
    </Suspense>
  )
}
