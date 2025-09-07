import { z } from 'zod'

/**
 * Zod schema for validating new poll creation data.
 * 
 * This schema defines the structure and validation rules for creating a new poll,
 * including title, description, options, voting settings, and closing date.
 * 
 * Validation Rules:
 * - Title: 3-120 characters required
 * - Description: Optional, max 500 characters
 * - Options: 2-10 options required, each must be non-empty
 * - Allow Multiple: Boolean, defaults to false
 * - Closing Date: Optional, must be in the future if provided
 * 
 * @constant {z.ZodObject} newPollSchema - Zod schema for poll validation
 */
export const newPollSchema = z.object({
  /**
   * Poll title - the main question or topic of the poll
   * @constraint min 3 characters, max 120 characters
   */
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
  
  /**
   * Optional description providing additional context about the poll
   * @constraint max 500 characters, can be empty string
   */
  description: z.string().max(500, 'Description is too long').optional().or(z.literal('')),
  
  /**
   * Array of poll options that users can vote on
   * @constraint 2-10 options required, each option must be non-empty
   */
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .min(2, 'Provide at least 2 options')
    .max(10, 'Maximum of 10 options allowed'),
  
  /**
   * Whether users can select multiple options when voting
   * @default false - single choice voting by default
   */
  allowMultiple: z.boolean().default(false),
  
  /**
   * Optional closing date for the poll
   * @constraint must be in the future if provided
   */
  closesAt: z
    .date({ required_error: 'Please select a closing date' })
    .refine((d) => d.getTime() > Date.now(), 'Closing date must be in the future')
    .optional(),
})

/**
 * TypeScript type inferred from the newPollSchema.
 * 
 * This type represents the structure of data required to create a new poll.
 * It's automatically generated from the Zod schema, ensuring type safety
 * between validation and TypeScript usage.
 * 
 * @typedef {Object} NewPollInput
 * @property {string} title - Poll title (3-120 characters)
 * @property {string} [description] - Optional poll description (max 500 characters)
 * @property {string[]} options - Array of poll options (2-10 items)
 * @property {boolean} allowMultiple - Whether multiple selections are allowed
 * @property {Date} [closesAt] - Optional closing date (must be in future)
 */
export type NewPollInput = z.infer<typeof newPollSchema>

