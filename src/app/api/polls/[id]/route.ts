import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client configured for server-side operations.
 * 
 * This function sets up a Supabase client with proper cookie handling
 * for server-side authentication and database operations. It uses the
 * Supabase SSR package to ensure proper session management.
 * 
 * @returns {SupabaseClient} Configured Supabase client for server operations
 */
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

/**
 * GET /api/polls/[id] - Retrieve a specific poll by ID
 * 
 * This endpoint fetches a single poll by its ID with proper authentication.
 * Only authenticated users can access this endpoint.
 * 
 * Security Features:
 * - Server-side authentication verification
 * - Poll ID validation
 * - Proper error handling without information disclosure
 * 
 * @param {NextRequest} request - The incoming HTTP request
 * @param {Object} context - Route context containing params
 * @param {Promise<{id: string}>} context.params - Route parameters with poll ID
 * @returns {Promise<NextResponse>} JSON response containing poll data or error
 * 
 * @example
 * ```typescript
 * // GET /api/polls/123e4567-e89b-12d3-a456-426614174000
 * // Response (200)
 * {
 *   "poll": {
 *     "id": "123e4567-e89b-12d3-a456-426614174000",
 *     "title": "What should we have for lunch?",
 *     "description": "Please choose your preferred option",
 *     "options": ["Pizza", "Burger", "Salad"],
 *     "allowMultiple": false,
 *     "closesAt": "2024-12-31T23:59:59Z",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "user_id": "user-uuid"
 *   }
 * }
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: pollId } = await params

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

/**
 * DELETE /api/polls/[id] - Delete a specific poll by ID
 * 
 * This endpoint deletes a poll by its ID with proper authentication and authorization.
 * Only the poll owner can delete their own polls.
 * 
 * Security Features:
 * - Server-side authentication verification
 * - Ownership verification (only poll owner can delete)
 * - Poll ID validation
 * - Proper error handling without information disclosure
 * 
 * @param {NextRequest} request - The incoming HTTP request
 * @param {Object} context - Route context containing params
 * @param {Promise<{id: string}>} context.params - Route parameters with poll ID
 * @returns {Promise<NextResponse>} JSON response confirming deletion or error
 * 
 * @example
 * ```typescript
 * // DELETE /api/polls/123e4567-e89b-12d3-a456-426614174000
 * // Response (200)
 * {
 *   "message": "Poll deleted successfully"
 * }
 * 
 * // Response (403) - Not the owner
 * {
 *   "error": "Forbidden: You can only delete your own polls"
 * }
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: pollId } = await params

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
