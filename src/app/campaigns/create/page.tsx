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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <CampaignBuilderWrapper
          type={campaignType}
          onSave={handleSave}
          onPreview={handlePreview}
        />
      </div>
    </div>
  )
}


export default function CreateCampaignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    }>
      <CampaignCreateContent />
    </Suspense>
  )
}
