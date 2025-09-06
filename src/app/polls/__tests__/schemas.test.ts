import { newPollSchema, type NewPollInput } from '../schemas'

describe('Poll Validation Schemas', () => {
  describe('newPollSchema', () => {
    it('should validate a valid poll with all required fields', () => {
      const validPoll: NewPollInput = {
        title: 'What should we have for lunch?',
        description: 'Please choose your preferred lunch option',
        options: ['Pizza', 'Burger', 'Salad'],
        allowMultiple: false,
        closesAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      }

      const result = newPollSchema.safeParse(validPoll)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validPoll)
      }
    })

    it('should validate a minimal valid poll with only required fields', () => {
      const minimalPoll: NewPollInput = {
        title: 'Test Poll',
        options: ['Option 1', 'Option 2'],
        allowMultiple: false,
      }

      const result = newPollSchema.safeParse(minimalPoll)
      expect(result.success).toBe(true)
    })

    it('should reject poll with title too short', () => {
      const invalidPoll = {
        title: 'Hi', // Less than 3 characters
        options: ['Option 1', 'Option 2'],
        allowMultiple: false,
      }

      const result = newPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be at least 3 characters')
      }
    })

    it('should reject poll with title too long', () => {
      const invalidPoll = {
        title: 'A'.repeat(121), // More than 120 characters
        options: ['Option 1', 'Option 2'],
        allowMultiple: false,
      }

      const result = newPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is too long')
      }
    })

    it('should reject poll with description too long', () => {
      const invalidPoll = {
        title: 'Test Poll',
        description: 'A'.repeat(501), // More than 500 characters
        options: ['Option 1', 'Option 2'],
        allowMultiple: false,
      }

      const result = newPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description is too long')
      }
    })

    it('should reject poll with less than 2 options', () => {
      const invalidPoll = {
        title: 'Test Poll',
        options: ['Only one option'],
        allowMultiple: false,
      }

      const result = newPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Provide at least 2 options')
      }
    })

    it('should reject poll with more than 10 options', () => {
      const invalidPoll = {
        title: 'Test Poll',
        options: Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`),
        allowMultiple: false,
      }

      const result = newPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum of 10 options allowed')
      }
    })

    it('should reject poll with empty option', () => {
      const invalidPoll = {
        title: 'Test Poll',
        options: ['Valid Option', ''], // Empty option
        allowMultiple: false,
      }

      const result = newPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Option cannot be empty')
      }
    })

    it('should reject poll with closing date in the past', () => {
      const invalidPoll = {
        title: 'Test Poll',
        options: ['Option 1', 'Option 2'],
        allowMultiple: false,
        closesAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      }

      const result = newPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Closing date must be in the future')
      }
    })

    it('should accept poll with empty description', () => {
      const validPoll = {
        title: 'Test Poll',
        description: '',
        options: ['Option 1', 'Option 2'],
        allowMultiple: false,
      }

      const result = newPollSchema.safeParse(validPoll)
      expect(result.success).toBe(true)
    })

    it('should accept poll without description field', () => {
      const validPoll = {
        title: 'Test Poll',
        options: ['Option 1', 'Option 2'],
        allowMultiple: false,
      }

      const result = newPollSchema.safeParse(validPoll)
      expect(result.success).toBe(true)
    })

    it('should default allowMultiple to false when not provided', () => {
      const pollWithoutAllowMultiple = {
        title: 'Test Poll',
        options: ['Option 1', 'Option 2'],
      }

      const result = newPollSchema.safeParse(pollWithoutAllowMultiple)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.allowMultiple).toBe(false)
      }
    })
  })
})
