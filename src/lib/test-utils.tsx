import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client for testing
export const mockSupabaseClient = createClient(
  'https://test.supabase.co',
  'test-anon-key'
)

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }