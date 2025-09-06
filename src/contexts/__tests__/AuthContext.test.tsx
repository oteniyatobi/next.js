import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth, useUser } from '../AuthContext'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

// Test component to access context
function TestComponent() {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  const userFromHook = useUser()

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not loading'}</div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <div data-testid="user-from-hook">{userFromHook ? userFromHook.email : 'no user'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signUp('test@example.com', 'password')}>Sign Up</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should provide initial loading state', () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
  })

  it('should handle successful authentication state change', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSession = { user: mockUser }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    let authStateChangeCallback: (event: string, session: any) => void = () => {}
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Simulate auth state change
    await act(async () => {
      authStateChangeCallback('SIGNED_IN', mockSession)
    })

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not loading')
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('user-from-hook')).toHaveTextContent('test@example.com')
    })
  })

  it('should handle sign out', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSession = { user: mockUser }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    let authStateChangeCallback: (event: string, session: any) => void = () => {}
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Simulate sign out
    await act(async () => {
      authStateChangeCallback('SIGNED_OUT', null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user')
      expect(screen.getByTestId('user-from-hook')).toHaveTextContent('no user')
    })
  })

  it('should call signInWithPassword on signIn', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signInButton = screen.getByText('Sign In')
    await act(async () => {
      signInButton.click()
    })

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('should call signUp on signUp', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signUpButton = screen.getByText('Sign Up')
    await act(async () => {
      signUpButton.click()
    })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('should call signOut on signOut', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signOutButton = screen.getByText('Sign Out')
    await act(async () => {
      signOutButton.click()
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('should handle authentication errors', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
    mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Invalid credentials'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signInButton = screen.getByText('Sign In')
    
    await expect(async () => {
      await act(async () => {
        signInButton.click()
      })
    }).rejects.toThrow('Invalid credentials')
  })
})
