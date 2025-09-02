import { supabase } from '@/lib/supabase'
import type { NewPollInput } from '@/app/polls/schemas'

export type InsertPollPayload = NewPollInput & {
  userId: string
}

export async function insertPoll(payload: InsertPollPayload) {
  const { title, description, options, allowMultiple, closesAt, userId } = payload

  // Ensure a table schema exists in your Supabase project:
  // table: polls (id uuid pk, user_id uuid, title text, description text, allow_multiple boolean, closes_at timestamp)
  // table: poll_options (id uuid pk, poll_id uuid fk, text text)

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      title,
      description: description || null,
      allow_multiple: allowMultiple,
      closes_at: closesAt ? closesAt.toISOString() : null,
      user_id: userId,
    })
    .select('*')
    .single()

  if (pollError) throw pollError

  const optionRows = options.map((text) => ({ poll_id: poll.id, text }))
  const { error: optionsError } = await supabase.from('poll_options').insert(optionRows)
  if (optionsError) throw optionsError

  return poll
}
