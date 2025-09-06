import { supabase } from '@/lib/supabase'
import { NewPollInput } from '@/app/polls/schemas'

export interface PollWithUserId extends NewPollInput {
  userId: string
}

export async function insertPoll(poll: PollWithUserId) {
  const { data, error } = await supabase
    .from('polls')
    .insert([poll])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create poll: ${error.message}`)
  }

  return data
}

export async function getPolls() {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch polls: ${error.message}`)
  }

  return data
}

export async function getPollById(id: string) {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch poll: ${error.message}`)
  }

  return data
}
