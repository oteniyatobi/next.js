'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Memoized auth state update function to prevent unnecessary re-renders
  const updateAuthState = useCallback((session: any) => {
    setUser(session?.user ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (isMounted) {
          updateAuthState(session)
        }
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error)
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          updateAuthState(session)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [updateAuthState])

  // Memoized auth functions to prevent unnecessary re-renders
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    // Enhanced validation
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }), [user, loading, signIn, signUp, signOut])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Convenience hook to access only the user (keeps UI decoupled from auth ops)
export function useUser() {
  const { user } = useAuth()
  return user
}
