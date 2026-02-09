'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  lastname?: string
  avatar?: string
}

interface Session {
  user: User | null
  loading: boolean
}

interface SessionContextType extends Session {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string, lastname?: string) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      console.log('🔍 Checking session...')
      const response = await fetch('/api/auth/session', {
        credentials: 'include' // Ensure cookies are included
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Session check result:', data)
        setUser(data.user)
      } else {
        console.log('❌ Session check failed, cleaning up')
        // If session check fails, clean up any invalid session
        await fetch('/api/auth/cleanup', { 
          method: 'POST',
          credentials: 'include'
        })
        setUser(null)
      }
    } catch (error) {
      console.error('Session check failed:', error)
      // Clean up on error
      try {
        await fetch('/api/auth/cleanup', { 
          method: 'POST',
          credentials: 'include'
        })
      } catch (cleanupError) {
        console.error('Session cleanup failed:', cleanupError)
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Ensure cookies are included
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    console.log('✅ Login response:', data)
    
    // Set user immediately from login response
    setUser(data.user)
    
    // Also refresh session to ensure consistency
    setTimeout(() => {
      checkSession()
    }, 100)
  }

  const signUp = async (email: string, password: string, name?: string, lastname?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, lastname })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }

    const data = await response.json()
    setUser(data.user)
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      // Redirect to home page after sign out
      window.location.href = '/'
    }
  }

  return (
    <SessionContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

export function useRequireAuth() {
  const { user, loading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  return { user, loading }
}