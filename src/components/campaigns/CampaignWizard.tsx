'use client'

import { useState, ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

interface WizardStep {
  id: string
  title: string
  description: string
}

interface CampaignWizardProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onNext: () => void
  onPrevious: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  children: ReactNode
}

export default function CampaignWizard({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  children
}: CampaignWizardProps) {
  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => index < currentStep && onStepChange(index)}
                  disabled={index > currentStep}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    index < currentStep
                      ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                      : index === currentStep
                      ? 'bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white border-2 border-emerald-400'
                      : 'bg-white/[0.05] text-white/40 cursor-not-allowed'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    index === currentStep ? 'text-white' : 'text-white/60'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-white/40 mt-1 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-4 ${
                  index < currentStep ? 'bg-emerald-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {currentStep === steps.length - 1 ? (
            !canGoNext && canGoNext !== undefined ? (
              <>Creating...</>
            ) : (
              <>Finish</>
            )
          ) : (
            <>Next</>
          )}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
