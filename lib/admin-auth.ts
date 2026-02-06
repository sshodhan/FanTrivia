import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Validates if a username belongs to an admin user.
 * Used for server-side admin route protection.
 * 
 * @param username - The username to check
 * @returns true if user exists and is_admin is true, false otherwise
 */
export async function isUserAdmin(username: string | null | undefined): Promise<boolean> {
  if (!username) return false;

  if (!supabaseUrl || !supabaseServiceKey) {
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('username', username)
      .single();

    if (error || !user) {
      return false;
    }

    return user.is_admin === true;
  } catch {
    return false;
  }
}

/**
 * Gets the current user's admin status from request headers or cookies.
 * This is a placeholder - in production you'd extract the user from
 * a session cookie or auth token.
 * 
 * @param request - The incoming request
 * @returns The username if found in headers, null otherwise
 */
export function getUsernameFromRequest(request: Request): string | null {
  // Check for username in custom header (set by client)
  const username = request.headers.get('x-username');
  return username;
}

/**
 * Validates admin access for an API route.
 * Returns an error response if not authorized.
 * 
 * @param request - The incoming request
 * @returns null if authorized, Response with error if not
 */
export async function validateAdminAccess(request: Request): Promise<Response | null> {
  const username = getUsernameFromRequest(request);
  
  if (!username) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - no user' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const isAdmin = await isUserAdmin(username);
  
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Forbidden - admin access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null; // Authorized
}
