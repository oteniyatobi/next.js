import { z } from 'zod'

// Enhanced password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )

// Email validation schema
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .transform(email => email.trim().toLowerCase())

// Rate limiting schema
export const rateLimitSchema = z.object({
  attempts: z.number().min(0).max(5),
  lastAttempt: z.date(),
  blockedUntil: z.date().optional(),
})

// Input sanitization function
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000) // Limit length
}

// Validate and sanitize poll input
export function sanitizePollInput(input: any) {
  if (typeof input.title === 'string') {
    input.title = sanitizeInput(input.title)
  }
  if (typeof input.description === 'string') {
    input.description = sanitizeInput(input.description)
  }
  if (Array.isArray(input.options)) {
    input.options = input.options.map((option: string) => 
      typeof option === 'string' ? sanitizeInput(option) : option
    )
  }
  return input
}

// Rate limiting helper
export class RateLimiter {
  private static attempts = new Map<string, { count: number; lastAttempt: Date; blockedUntil?: Date }>()

  static isBlocked(identifier: string): boolean {
    const data = this.attempts.get(identifier)
    if (!data) return false

    if (data.blockedUntil && new Date() < data.blockedUntil) {
      return true
    }

    // Reset if block period has passed
    if (data.blockedUntil && new Date() >= data.blockedUntil) {
      this.attempts.delete(identifier)
      return false
    }

    return false
  }

  static recordAttempt(identifier: string): { allowed: boolean; remainingAttempts: number; blockedUntil?: Date } {
    const now = new Date()
    const data = this.attempts.get(identifier)

    if (!data) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return { allowed: true, remainingAttempts: 4 }
    }

    // Reset if more than 15 minutes have passed
    if (now.getTime() - data.lastAttempt.getTime() > 15 * 60 * 1000) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return { allowed: true, remainingAttempts: 4 }
    }

    const newCount = data.count + 1
    this.attempts.set(identifier, { count: newCount, lastAttempt: now })

    if (newCount > 5) {
      const blockedUntil = new Date(now.getTime() + 15 * 60 * 1000) // Block for 15 minutes
      this.attempts.set(identifier, { ...data, blockedUntil })
      return { allowed: false, remainingAttempts: 0, blockedUntil }
    }

    return { allowed: true, remainingAttempts: 5 - newCount }
  }
}
