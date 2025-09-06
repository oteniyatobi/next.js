import { z } from 'zod'

export const newPollSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional().or(z.literal('')),
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .min(2, 'Provide at least 2 options')
    .max(10, 'Maximum of 10 options allowed'),
  allowMultiple: z.boolean().default(false),
  closesAt: z
    .date({ required_error: 'Please select a closing date' })
    .refine((d) => d.getTime() > Date.now(), 'Closing date must be in the future')
    .optional(),
})

export type NewPollInput = z.infer<typeof newPollSchema>

