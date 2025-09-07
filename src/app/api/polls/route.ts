import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { newPollSchema } from '@/app/polls/schemas'

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
        /**
         * Get cookie value by name
         * @param {string} name - Cookie name
         * @returns {string | undefined} Cookie value or undefined if not found
         */
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        /**
         * Set cookie with name, value, and options
         * @param {string} name - Cookie name
         * @param {string} value - Cookie value
         * @param {any} options - Cookie options (expires, httpOnly, etc.)
         */
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        /**
         * Remove cookie by setting it to empty value
         * @param {string} name - Cookie name
         * @param {any} options - Cookie options for removal
         */
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

/**
 * GET /api/polls - Retrieve all polls
 * 
 * This endpoint fetches all polls from the database with proper authentication.
 * Only authenticated users can access this endpoint.
 * 
 * Security Features:
 * - Server-side authentication verification
 * - Proper error handling without information disclosure
 * - Database query optimization with specific field selection
 * 
 * @param {NextRequest} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response containing polls array or error
 * 
 * @example
 * ```typescript
 * // Successful response
 * {
 *   "polls": [
 *     {
 *       "id": "uuid",
 *       "title": "What should we have for lunch?",
 *       "description": "Please choose your preferred option",
 *       "options": ["Pizza", "Burger", "Salad"],
 *       "allowMultiple": false,
 *       "closesAt": "2024-12-31T23:59:59Z",
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "user_id": "user-uuid"
 *     }
 *   ]
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Verify user authentication before allowing access to polls
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    // Return 401 if user is not authenticated
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch polls with specific fields for security and performance
    const { data: polls, error } = await supabase
      .from('polls')
      .select('id, title, description, options, allowMultiple, closesAt, created_at, user_id')
      .order('created_at', { ascending: false }) // Most recent polls first

    // Handle database errors
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      )
    }

    return NextResponse.json({ polls })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/polls - Create a new poll
 * 
 * This endpoint creates a new poll in the database with proper authentication
 * and validation. Only authenticated users can create polls.
 * 
 * Security Features:
 * - Server-side authentication verification
 * - Input validation using Zod schema
 * - User ownership assignment for data security
 * - Comprehensive error handling
 * 
 * @param {NextRequest} request - The incoming HTTP request with poll data
 * @returns {Promise<NextResponse>} JSON response containing created poll or error
 * 
 * @example
 * ```typescript
 * // Request body
 * {
 *   "title": "What should we have for lunch?",
 *   "description": "Please choose your preferred option",
 *   "options": ["Pizza", "Burger", "Salad"],
 *   "allowMultiple": false,
 *   "closesAt": "2024-12-31T23:59:59Z"
 * }
 * 
 * // Successful response (201)
 * {
 *   "poll": {
 *     "id": "uuid",
 *     "title": "What should we have for lunch?",
 *     "description": "Please choose your preferred option",
 *     "options": ["Pizza", "Burger", "Salad"],
 *     "allowMultiple": false,
 *     "closesAt": "2024-12-31T23:59:59Z",
 *     "created_at": "2024-01-01T00:00:00Z"
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Verify user authentication before allowing poll creation
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    // Return 401 if user is not authenticated
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate the request body
    const body = await request.json()
    
    // Validate input using Zod schema to ensure data integrity
    const validationResult = newPollSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    // Prepare poll data with user ownership and timestamp
    const pollData = {
      ...validationResult.data,
      user_id: session.user.id, // Assign ownership to the authenticated user
      created_at: new Date().toISOString(), // Add creation timestamp
    }

    // Insert poll into database with proper authorization
    const { data: poll, error } = await supabase
      .from('polls')
      .insert([pollData])
      .select('id, title, description, options, allowMultiple, closesAt, created_at')
      .single()

    // Handle database errors
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      )
    }

    // Return created poll with 201 status
    return NextResponse.json({ poll }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
