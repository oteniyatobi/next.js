import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function createSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    
    // Verify authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const pollId = params.id

    // Validate poll ID format
    if (!pollId || typeof pollId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid poll ID' },
        { status: 400 }
      )
    }

    // Get poll with proper authorization
    const { data: poll, error } = await supabase
      .from('polls')
      .select('id, title, description, options, allowMultiple, closesAt, created_at, user_id')
      .eq('id', pollId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch poll' },
        { status: 500 }
      )
    }

    return NextResponse.json({ poll })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    
    // Verify authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const pollId = params.id

    // Validate poll ID format
    if (!pollId || typeof pollId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid poll ID' },
        { status: 400 }
      )
    }

    // First, check if poll exists and user owns it
    const { data: poll, error: fetchError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', pollId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch poll' },
        { status: 500 }
      )
    }

    // Check if user owns the poll
    if (poll.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own polls' },
        { status: 403 }
      )
    }

    // Delete the poll
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete poll' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Poll deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
