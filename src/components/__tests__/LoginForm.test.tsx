import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'
import { AuthProvider } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('LoginForm Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  it('should render login form with all required elements', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
  })

  it('should handle successful login with proper user flow and state management', async () => {
    const user = userEvent.setup()
    const mockUser = { 
      id: '1', 
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      aud: 'authenticated',
      role: 'authenticated'
    }
    const mockSession = { 
      user: mockUser, 
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000
    }
    
    // Mock successful authentication response
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    })

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    // Verify initial state
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    // Simulate user interaction with realistic timing
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    // Verify form state before submission
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
    expect(submitButton).not.toBeDisabled()

    // Submit form
    await user.click(submitButton)

    // Verify API call with exact parameters
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(1)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    // Verify navigation occurs after successful authentication
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    // Verify no error messages are displayed
    expect(screen.queryByText(/error|invalid|failed/i)).not.toBeInTheDocument()
  })

  it('should display error message on login failure', async () => {
    const user = userEvent.setup()
    
    mockSupabase.auth.signInWithPassword.mockRejectedValue(
      new Error('Invalid login credentials')
    )

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show loading state during login', async () => {
    const user = userEvent.setup()
    
    // Create a promise that we can control
    let resolvePromise: (value: any) => void
    const loginPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    
    mockSupabase.auth.signInWithPassword.mockReturnValue(loginPromise as any)

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Check loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Resolve the promise
    resolvePromise!({
      data: { user: { id: '1', email: 'test@example.com' }, session: {} },
      error: null,
    })

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })
  })

  it('should clear error message when user starts typing', async () => {
    const user = userEvent.setup()
    
    mockSupabase.auth.signInWithPassword.mockRejectedValue(
      new Error('Invalid login credentials')
    )

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    // First, trigger an error
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })

    // Clear inputs and type again
    await user.clear(emailInput)
    await user.clear(passwordInput)
    await user.type(emailInput, 'new@example.com')

    // Error should be cleared
    expect(screen.queryByText('Invalid login credentials')).not.toBeInTheDocument()
  })

  it('should navigate to register page when sign up is clicked', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const signUpButton = screen.getByRole('button', { name: 'Sign up' })
    await user.click(signUpButton)

    expect(mockPush).toHaveBeenCalledWith('/auth/register')
  })

  it('should require email and password fields', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    // Check that inputs are required
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()

    // Try to submit without filling fields
    await user.click(submitButton)

    // Form should not submit (browser validation)
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup()
    
    mockSupabase.auth.signInWithPassword.mockRejectedValue(
      new Error('Network error')
    )

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should handle non-Error exceptions', async () => {
    const user = userEvent.setup()
    
    mockSupabase.auth.signInWithPassword.mockRejectedValue('String error')

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument()
    })
  })
})
