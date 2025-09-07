'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * Authentication context interface defining the shape of authentication state and methods.
 * 
 * @interface AuthContextType
 * @property {User | null} user - Current authenticated user or null if not authenticated
 * @property {boolean} loading - Loading state for authentication operations
 * @property {Function} signIn - Function to sign in a user with email and password
 * @property {Function} signUp - Function to register a new user with email and password
 * @property {Function} signOut - Function to sign out the current user
 */
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

/**
 * Authentication context for managing user authentication state across the application.
 * This context provides authentication methods and user state to all child components.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication provider component that manages authentication state and provides
 * authentication methods to all child components through React Context.
 * 
 * This component handles:
 * - Initial authentication state loading
 * - Session management and updates
 * - User sign in, sign up, and sign out operations
 * - Error handling and loading states
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with authentication context
 * @returns {JSX.Element} Authentication provider component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Authentication state management
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Memoized function to update authentication state.
   * This prevents unnecessary re-renders by maintaining a stable reference.
   * 
   * @param {any} session - Supabase session object containing user data
   */
  const updateAuthState = useCallback((session: any) => {
    setUser(session?.user ?? null)
    setLoading(false)
  }, [])

  /**
   * Effect hook that initializes authentication state and sets up session listeners.
   * This runs once when the component mounts and handles:
   * - Loading the initial user session
   * - Setting up real-time authentication state changes
   * - Proper cleanup to prevent memory leaks
   */
  useEffect(() => {
    let isMounted = true

    /**
     * Initialize authentication by checking for existing session.
     * This function handles the initial authentication state loading with proper error handling.
     */
    const initializeAuth = async () => {
      try {
        // Attempt to get the current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Handle session retrieval errors
        if (error) {
          console.error('Error getting session:', error)
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        // Update auth state if component is still mounted
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

    // Initialize authentication on component mount
    initializeAuth()

    /**
     * Set up real-time authentication state change listener.
     * This ensures the UI stays in sync with authentication changes across tabs/windows.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only update state if component is still mounted to prevent memory leaks
        if (isMounted) {
          updateAuthState(session)
        }
      }
    )

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [updateAuthState])

  /**
   * Sign in an existing user with email and password.
   * 
   * This function:
   * - Normalizes the email (trims whitespace and converts to lowercase)
   * - Authenticates with Supabase
   * - Throws an error if authentication fails
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @throws {Error} If authentication fails
   * @returns {Promise<void>} Promise that resolves when sign in is complete
   */
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), // Normalize email for consistency
      password,
    })
    if (error) throw error
  }, [])

  /**
   * Register a new user with email and password.
   * 
   * This function:
   * - Validates password strength (8+ chars, complexity requirements)
   * - Normalizes the email address
   * - Creates a new user account with Supabase
   * - Sends email confirmation (handled by Supabase)
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password (must meet complexity requirements)
   * @throws {Error} If password doesn't meet requirements or registration fails
   * @returns {Promise<void>} Promise that resolves when registration is complete
   */
  const signUp = useCallback(async (email: string, password: string) => {
    // Enhanced password validation for security
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    
    // Check password complexity requirements
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), // Normalize email for consistency
      password,
      options: {
        // Redirect to callback route after email confirmation
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }, [])

  /**
   * Sign out the current user.
   * 
   * This function:
   * - Clears the current user session
   * - Removes authentication tokens
   * - Updates the UI state to reflect logged out status
   * 
   * @throws {Error} If sign out fails
   * @returns {Promise<void>} Promise that resolves when sign out is complete
   */
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  /**
   * Memoized context value to prevent unnecessary re-renders.
   * This ensures that child components only re-render when authentication state actually changes.
   */
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

/**
 * Hook to access authentication context.
 * 
 * This hook provides access to the authentication state and methods.
 * Must be used within an AuthProvider component.
 * 
 * @throws {Error} If used outside of AuthProvider
 * @returns {AuthContextType} Authentication context with user state and methods
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, signIn, signOut } = useAuth()
 *   
 *   if (loading) return <div>Loading...</div>
 *   if (!user) return <LoginForm />
 *   
 *   return <div>Welcome, {user.email}!</div>
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Convenience hook to access only the current user.
 * 
 * This hook provides a simpler way to access just the user object
 * without needing to destructure from useAuth. Useful for components
 * that only need to check authentication status.
 * 
 * @returns {User | null} Current authenticated user or null if not authenticated
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const user = useUser()
 *   
 *   if (!user) return <div>Please log in</div>
 *   
 *   return <div>Hello, {user.email}!</div>
 * }
 * ```
 */
export function useUser() {
  const { user } = useAuth()
  return user
}
