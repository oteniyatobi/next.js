import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewPollForm from '../NewPollForm'
import { AuthProvider } from '@/contexts/AuthContext'
import { insertPoll } from '@/app/api/polls/queries'

// Mock the API queries
jest.mock('@/app/api/polls/queries', () => ({
  insertPoll: jest.fn(),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}))

const mockInsertPoll = insertPoll as jest.MockedFunction<typeof insertPoll>

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('NewPollForm Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render poll form with all required elements', () => {
    render(
      <TestWrapper>
        <NewPollForm />
      </TestWrapper>
    )

    expect(screen.getByText('New Poll')).toBeInTheDocument()
    expect(screen.getByText('Create a poll with at least two options.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument()
    expect(screen.getByText('Options')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add option' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove last' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Poll' })).toBeInTheDocument()
  })

  it('should create a poll successfully', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com' }
    
    // Mock authenticated user
    jest.spyOn(require('@/contexts/AuthContext'), 'useUser').mockReturnValue(mockUser)
    
    mockInsertPoll.mockResolvedValue({ id: '1', title: 'Test Poll' })

    render(
      <TestWrapper>
        <NewPollForm />
      </TestWrapper>
    )

    const titleInput = screen.getByLabelText('Title')
    const descriptionInput = screen.getByLabelText('Description (optional)')
    const option1Input = screen.getByDisplayValue('')
    const option2Input = screen.getAllByDisplayValue('')[1]
    const createButton = screen.getByRole('button', { name: 'Create Poll' })

    await user.type(titleInput, 'What should we have for lunch?')
    await user.type(descriptionInput, 'Please choose your preferred option')
    await user.type(option1Input, 'Pizza')
    await user.type(option2Input, 'Burger')
    await user.click(createButton)

    await waitFor(() => {
      expect(mockInsertPoll).toHaveBeenCalledWith({
        title: 'What should we have for lunch?',
        description: 'Please choose your preferred option',
        options: ['Pizza', 'Burger'],
        allowMultiple: false,
        closesAt: undefined,
        userId: '1',
      })
    })

    // Form should be reset after successful submission
    await waitFor(() => {
      expect(titleInput).toHaveValue('')
      expect(descriptionInput).toHaveValue('')
    })
  })

  it('should add and remove options dynamically', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com' }
    
    jest.spyOn(require('@/contexts/AuthContext'), 'useUser').mockReturnValue(mockUser)

    render(
      <TestWrapper>
        <NewPollForm />
      </TestWrapper>
    )

    const addButton = screen.getByRole('button', { name: 'Add option' })
    const removeButton = screen.getByRole('button', { name: 'Remove last' })

    // Initially should have 2 options
    expect(screen.getAllByDisplayValue('')).toHaveLength(2)

    // Add a third option
    await user.click(addButton)
    expect(screen.getAllByDisplayValue('')).toHaveLength(3)

    // Add a fourth option
    await user.click(addButton)
    expect(screen.getAllByDisplayValue('')).toHaveLength(4)

    // Remove the last option
    await user.click(removeButton)
    expect(screen.getAllByDisplayValue('')).toHaveLength(3)

    // Remove another option
    await user.click(removeButton)
    expect(screen.getAllByDisplayValue('')).toHaveLength(2)

    // Should not be able to remove below 2 options
    expect(removeButton).toBeDisabled()
  })

  it('should show error when user is not authenticated', async () => {
    const user = userEvent.setup()
    
    // Mock unauthenticated user
    jest.spyOn(require('@/contexts/AuthContext'), 'useUser').mockReturnValue(null)

    render(
      <TestWrapper>
        <NewPollForm />
      </TestWrapper>
    )

    const titleInput = screen.getByLabelText('Title')
    const option1Input = screen.getByDisplayValue('')
    const option2Input = screen.getAllByDisplayValue('')[1]
    const createButton = screen.getByRole('button', { name: 'Create Poll' })

    await user.type(titleInput, 'Test Poll')
    await user.type(option1Input, 'Option 1')
    await user.type(option2Input, 'Option 2')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('You must be signed in to create a poll.')).toBeInTheDocument()
    })

    expect(mockInsertPoll).not.toHaveBeenCalled()
  })

  it('should show error when poll creation fails', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com' }
    
    jest.spyOn(require('@/contexts/AuthContext'), 'useUser').mockReturnValue(mockUser)
    mockInsertPoll.mockRejectedValue(new Error('Database connection failed'))

    render(
      <TestWrapper>
        <NewPollForm />
      </TestWrapper>
    )

    const titleInput = screen.getByLabelText('Title')
    const option1Input = screen.getByDisplayValue('')
    const option2Input = screen.getAllByDisplayValue('')[1]
    const createButton = screen.getByRole('button', { name: 'Create Poll' })

    await user.type(titleInput, 'Test Poll')
    await user.type(option1Input, 'Option 1')
    await user.type(option2Input, 'Option 2')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com' }
    
    jest.spyOn(require('@/contexts/AuthContext'), 'useUser').mockReturnValue(mockUser)

    // Create a promise that we can control
    let resolvePromise: (value: any) => void
    const pollPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    
    mockInsertPoll.mockReturnValue(pollPromise as any)

    render(
      <TestWrapper>
        <NewPollForm />
      </TestWrapper>
    )

    const titleInput = screen.getByLabelText('Title')
    const option1Input = screen.getByDisplayValue('')
    const option2Input = screen.getAllByDisplayValue('')[1]
    const createButton = screen.getByRole('button', { name: 'Create Poll' })

    await user.type(titleInput, 'Test Poll')
    await user.type(option1Input, 'Option 1')
    await user.type(option2Input, 'Option 2')
    await user.click(createButton)

    // Check loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(createButton).toBeDisabled()

    // Resolve the promise
    resolvePromise!({ id: '1', title: 'Test Poll' })

    await waitFor(() => {
      expect(screen.getByText('Create Poll')).toBeInTheDocument()
    })
  })

  it('should validate form fields and show errors', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com' }
    
    jest.spyOn(require('@/contexts/AuthContext'), 'useUser').mockReturnValue(mockUser)

    render(
      <TestWrapper>
        <NewPollForm />
      </TestWrapper>
    )

    const createButton = screen.getByRole('button', { name: 'Create Poll' })

    // Try to submit with empty title
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument()
    })

    // Try with title too short
    const titleInput = screen.getByLabelText('Title')
    await user.type(titleInput, 'Hi')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument()
    })

    // Try with empty options
    await user.clear(titleInput)
    await user.type(titleInput, 'Valid Title')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Option cannot be empty')).toBeInTheDocument()
    })
  })

  it('should handle non-Error exceptions gracefully', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com' }
    
    jest.spyOn(require('@/contexts/AuthContext'), 'useUser').mockReturnValue(mockUser)
    mockInsertPoll.mockRejectedValue('String error')

    render(
      <TestWrapper>
        <NewPollForm />
      </TestWrapper>
    )

    const titleInput = screen.getByLabelText('Title')
    const option1Input = screen.getByDisplayValue('')
    const option2Input = screen.getAllByDisplayValue('')[1]
    const createButton = screen.getByRole('button', { name: 'Create Poll' })

    await user.type(titleInput, 'Test Poll')
    await user.type(option1Input, 'Option 1')
    await user.type(option2Input, 'Option 2')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to create poll')).toBeInTheDocument()
    })
  })

  it('should clear server error when user starts typing', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com' }
    
    jest.spyOn(require('@/contexts/AuthContext'), 'useUser').mockReturnValue(mockUser)
    mockInsertPoll.mockRejectedValue(new Error('Server error'))

    render(
      <TestWrapper>
        <NewPollForm />
      </TestWrapper>
    )

    const titleInput = screen.getByLabelText('Title')
    const option1Input = screen.getByDisplayValue('')
    const option2Input = screen.getAllByDisplayValue('')[1]
    const createButton = screen.getByRole('button', { name: 'Create Poll' })

    // First, trigger an error
    await user.type(titleInput, 'Test Poll')
    await user.type(option1Input, 'Option 1')
    await user.type(option2Input, 'Option 2')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })

    // Clear and type again
    await user.clear(titleInput)
    await user.type(titleInput, 'New Title')

    // Error should be cleared
    expect(screen.queryByText('Server error')).not.toBeInTheDocument()
  })
})
