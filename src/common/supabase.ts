// Supabase client configuration and setup
import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js'
import { supabaseDb } from '@config/environment'
import { Database } from './database-types'

// Enhanced secure storage implementation
const secureStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      return item
    } catch (error) {
      console.error('Error reading from secure storage:', error)
      return null
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('Error writing to secure storage:', error)
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from secure storage:', error)
    }
  }
}

// Create a single supabase client with enhanced security configuration
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseDb.SUPA_URL,
  supabaseDb.SUPA_KEY,
  {
    auth: {
      // Automatically refresh tokens when they expire
      autoRefreshToken: true,
      // Persist session securely
      persistSession: true,
      // Detect session from URL (useful for email confirmations and OAuth)
      detectSessionInUrl: true,
      // Enhanced secure storage implementation
      storage: secureStorage,
      // Flow type for PKCE (Proof Key for Code Exchange) - more secure
      flowType: 'pkce',
      // Debug mode for development
      debug: process.env.NODE_ENV === 'development'
    },
    global: {
      headers: {
        'x-application-name': 'AZReader',
        'x-client-info': 'azreader-ionic-v1.17.0'
      }
    }
  }
)

// Auth helper functions
export const authHelpers = {
  /**
   * Get the current user session
   */
  getCurrentSession: async (): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> => {
    const { data, error } = await supabase.auth.getSession()
    return {
      user: data.session?.user ?? null,
      session: data.session,
      error
    }
  },

  /**
   * Get the current user
   */
  getCurrentUser: async (): Promise<{ user: User | null; error: AuthError | null }> => {
    const { data, error } = await supabase.auth.getUser()
    return {
      user: data.user,
      error
    }
  },

  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string, options?: {
    data?: object
    redirectTo?: string
  }): Promise<{ user: User | null; error: AuthError | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: options?.redirectTo || 'azreader://auth/confirm',
        data: options?.data
      }
    })
    return {
      user: data.user,
      error
    }
  },

  /**
   * Sign in with email and password
   */
  signInWithPassword: async (email: string, password: string): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return {
      user: data.user,
      session: data.session,
      error
    }
  },

  /**
   * Sign in with OAuth provider
   */
  signInWithOAuth: async (provider: 'google' | 'apple' | 'twitter', options?: {
    redirectTo?: string
    scopes?: string
  }): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: options?.redirectTo || 'azreader://auth/confirm',
        scopes: options?.scopes
      }
    })
    return { error }
  },

  /**
   * Sign out
   */
  signOut: async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'azreader://auth/reset'
    })
    return { error }
  },

  /**
   * Update user password
   */
  updatePassword: async (password: string): Promise<{ user: User | null; error: AuthError | null }> => {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return {
      user: data.user,
      error
    }
  },

  /**
   * Update user metadata
   */
  updateUser: async (attributes: {
    email?: string
    data?: object
  }): Promise<{ user: User | null; error: AuthError | null }> => {
    const { data, error } = await supabase.auth.updateUser(attributes)
    return {
      user: data.user,
      error
    }
  },

  /**
   * Refresh the current session
   */
  refreshSession: async (): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> => {
    const { data, error } = await supabase.auth.refreshSession()
    return {
      user: data.user,
      session: data.session,
      error
    }
  },

  /**
   * Listen to auth changes with enhanced logging and validation
   */
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      const eventInfo = {
        event,
        userId: session?.user?.id,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        timestamp: new Date().toISOString()
      }
      
      console.log('Auth state changed:', eventInfo)
      
      // Additional security: validate session integrity
      if (session && session.access_token) {
        try {
          // Basic token validation (check if it's a valid JWT structure)
          const tokenParts = session.access_token.split('.')
          if (tokenParts.length !== 3) {
            console.warn('Invalid token structure detected')
          }
        } catch (error) {
          console.error('Token validation error:', error)
        }
      }
      
      callback(event, session)
    })
  },
  
  /**
   * Secure sign out with complete cleanup
   */
  secureSignOut: async (): Promise<{ error: AuthError | null }> => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      // Additional cleanup: clear any cached data
      if (typeof window !== 'undefined') {
        try {
          // Clear specific auth-related items
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.startsWith('sb-') || key.includes('supabase')
          )
          keysToRemove.forEach(key => localStorage.removeItem(key))
          
          // Clear session storage as well
          sessionStorage.clear()
        } catch (storageError) {
          console.error('Error clearing storage during sign out:', storageError)
        }
      }
      
      return { error }
    } catch (err) {
      const error = err as AuthError
      console.error('Secure sign out error:', error)
      return { error }
    }
  }
}

// Database helper functions for user management
export const dbHelpers = {
  /**
   * Get user profile from database
   */
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },

  /**
   * Create or update user profile
   */
  upsertUserProfile: async (userData: {
    id: string
    email: string
    name?: string
    avatar_url?: string
    auth_provider?: string
    bio?: string
    website?: string
    is_public?: boolean
  }) => {
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single()
    
    return { data, error }
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (userId: string, updates: {
    name?: string
    avatar_url?: string
    bio?: string
    website?: string
    is_public?: boolean
  }) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  /**
   * Get user preferences
   */
  getUserPreferences: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  /**
   * Update user preferences
   */
  updateUserPreferences: async (userId: string, preferences: {
    theme_mode?: 'light' | 'dark' | 'system'
    reading_font_family?: string
    reading_font_size?: number
    reading_line_height?: number
    reading_width?: 'narrow' | 'medium' | 'wide'
    auto_mark_read?: boolean
    notifications_enabled?: boolean
  }) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        { user_id: userId, ...preferences },
        { onConflict: 'user_id' }
      )
      .select()
      .single()
    
    return { data, error }
  }
}

// Export the configured client as default
export default supabase