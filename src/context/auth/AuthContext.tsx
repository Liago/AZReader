import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { useIonRouter } from '@ionic/react'
import { supabase, authHelpers, dbHelpers } from '@common/supabase'
import { Database, User as UserProfile } from '@common/database-types'

// Auth context types
export interface AuthState {
  // Core auth state
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  
  // Loading states
  loading: boolean
  initialLoading: boolean
  
  // Error state
  error: AuthError | string | null
  
  // Auth methods
  signUp: (email: string, password: string, userData?: { name?: string }) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithApple: () => Promise<{ error: AuthError | null }>
  signInWithTwitter: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: {
    name?: string
    avatar_url?: string
    bio?: string
    website?: string
    is_public?: boolean
  }) => Promise<{ error: any }>
  
  // Helper methods
  refreshSession: () => Promise<{ error: AuthError | null }>
  clearError: () => void
}

// Create the context
const AuthContext = createContext<AuthState | null>(null)

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useIonRouter()
  
  // State management
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<AuthError | string | null>(null)
  
  // Session refresh management
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = useRef(3)
  const retryCount = useRef(0)

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load user profile
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await dbHelpers.getUserProfile(userId)
      if (error) {
        console.error('Error loading user profile:', error)
        return
      }
      setUserProfile(data)
    } catch (err) {
      console.error('Error loading user profile:', err)
    }
  }, [])

  // Create or update user profile when user signs up/in
  const syncUserProfile = useCallback(async (user: User) => {
    try {
      const { data, error } = await dbHelpers.upsertUserProfile({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        auth_provider: user.app_metadata?.provider || 'email',
        is_public: false
      })
      
      if (error) {
        console.error('Error syncing user profile:', error)
        return
      }
      
      setUserProfile(data)
    } catch (err) {
      console.error('Error syncing user profile:', err)
    }
  }, [])

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, userData?: { name?: string }) => {
    setLoading(true)
    setError(null)
    
    try {
      const { user, error } = await authHelpers.signUp(email, password, {
        data: userData
      })
      
      if (error) {
        setError(error)
        return { error }
      }
      
      // User will receive email confirmation
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign up failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { user, session, error } = await authHelpers.signInWithPassword(email, password)
      
      if (error) {
        setError(error)
        return { error }
      }
      
      if (user && session) {
        setUser(user)
        setSession(session)
        await syncUserProfile(user)
      }
      
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign in failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [syncUserProfile])

  // Sign in with OTP (magic link / passwordless)
  const signInWithOtp = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // Creates new user if doesn't exist
          emailRedirectTo: window.location.origin,
        },
      })
      
      if (error) {
        setError(error)
        return { error }
      }
      
      // Success - OTP/magic link sent
      console.log("OTP/Magic link sent successfully")
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'OTP sign in failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [])

  // Verify OTP code
  const verifyOtp = useCallback(async (email: string, token: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
      
      if (error) {
        setError(error)
        return { error }
      }
      
      if (data.user && data.session) {
        setUser(data.user)
        setSession(data.session)
        await syncUserProfile(data.user)
        console.log("OTP verified successfully")
      }
      
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'OTP verification failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [syncUserProfile])

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await authHelpers.signInWithOAuth('google')
      if (error) {
        setError(error)
        return { error }
      }
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Google sign in failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign in with Apple
  const signInWithApple = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await authHelpers.signInWithOAuth('apple')
      if (error) {
        setError(error)
        return { error }
      }
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Apple sign in failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign in with Twitter
  const signInWithTwitter = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await authHelpers.signInWithOAuth('twitter')
      if (error) {
        setError(error)
        return { error }
      }
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Twitter sign in failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out with secure cleanup
  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Use secure sign out if available
      const { error } = await (authHelpers.secureSignOut || authHelpers.signOut)()
      
      if (error) {
        setError(error)
        return { error }
      }
      
      // Clear state
      setUser(null)
      setSession(null)
      setUserProfile(null)
      
      // Clear any scheduled refreshes
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
      
      // Reset retry count
      retryCount.current = 0
      
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign out failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await authHelpers.resetPassword(email)
      
      if (error) {
        setError(error)
        return { error }
      }
      
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Password reset failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [])

  // Update password
  const updatePassword = useCallback(async (password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { user, error } = await authHelpers.updatePassword(password)
      
      if (error) {
        setError(error)
        return { error }
      }
      
      if (user) {
        setUser(user)
      }
      
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Password update failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [])

  // Update profile
  const updateProfile = useCallback(async (updates: {
    name?: string
    avatar_url?: string
    bio?: string
    website?: string
    is_public?: boolean
  }) => {
    if (!user) {
      const error = new Error('No user logged in')
      setError(error.message)
      return { error }
    }

    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await dbHelpers.updateUserProfile(user.id, updates)
      
      if (error) {
        setError(error.message || 'Profile update failed')
        return { error }
      }
      
      if (data) {
        setUserProfile(data)
      }
      
      return { error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Profile update failed'
      setError(errorMsg)
      return { error: errorMsg as any }
    } finally {
      setLoading(false)
    }
  }, [user])

  // Schedule automatic token refresh
  const scheduleTokenRefresh = useCallback((session: Session) => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    if (!session.expires_at) return
    
    const expiresAt = session.expires_at * 1000 // Convert to milliseconds
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now
    
    // Refresh token 5 minutes before expiry (minimum 1 minute)
    const refreshBuffer = Math.max(5 * 60 * 1000, 60 * 1000) // 5 minutes or 1 minute minimum
    const refreshTime = Math.max(timeUntilExpiry - refreshBuffer, 30 * 1000) // At least 30 seconds
    
    console.log(`Scheduling token refresh in ${Math.round(refreshTime / 1000)} seconds`)
    
    refreshTimeoutRef.current = setTimeout(async () => {
      await performTokenRefresh()
    }, refreshTime)
  }, [])
  
  // Perform token refresh with retry logic
  const performTokenRefresh = useCallback(async (): Promise<{ error: AuthError | null }> => {
    try {
      console.log('Attempting automatic token refresh...')
      
      const { user, session, error } = await authHelpers.refreshSession()
      
      if (error) {
        console.error('Token refresh failed:', error)
        retryCount.current += 1
        
        // If we've exceeded max retries, redirect to login
        if (retryCount.current >= maxRetries.current) {
          console.error('Max token refresh retries exceeded, redirecting to login')
          await handleSessionExpiry()
          return { error }
        }
        
        // Retry with exponential backoff
        const backoffTime = Math.pow(2, retryCount.current) * 1000 // 1s, 2s, 4s...
        console.log(`Retrying token refresh in ${backoffTime / 1000} seconds...`)
        
        setTimeout(() => {
          performTokenRefresh()
        }, backoffTime)
        
        return { error }
      }
      
      // Successful refresh
      console.log('Token refresh successful')
      retryCount.current = 0 // Reset retry count
      
      if (user && session) {
        setUser(user)
        setSession(session)
        await loadUserProfile(user.id)
        
        // Schedule next refresh
        scheduleTokenRefresh(session)
      }
      
      return { error: null }
    } catch (err) {
      console.error('Token refresh error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Session refresh failed'
      setError(errorMsg)
      
      retryCount.current += 1
      if (retryCount.current >= maxRetries.current) {
        await handleSessionExpiry()
      }
      
      return { error: errorMsg as any }
    }
  }, [loadUserProfile, scheduleTokenRefresh])
  
  // Handle session expiry
  const handleSessionExpiry = useCallback(async () => {
    console.log('Session expired, clearing auth state and redirecting to login')
    
    // Clear all auth state
    setUser(null)
    setSession(null)
    setUserProfile(null)
    setError('Your session has expired. Please log in again.')
    
    // Clear any scheduled refreshes
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
    
    // Reset retry count
    retryCount.current = 0
    
    // Redirect to login (home page which shows auth component when not authenticated)
    router.push('/', 'root', 'replace')
  }, [router])
  
  // Manual refresh session (for user-triggered refresh)
  const refreshSession = useCallback(async () => {
    setError(null)
    setLoading(true)
    
    try {
      const result = await performTokenRefresh()
      return result
    } finally {
      setLoading(false)
    }
  }, [performTokenRefresh])

  // Initialize auth state and set up listeners
  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { user, session, error } = await authHelpers.getCurrentSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting initial session:', error)
          setError(error)
        } else if (user && session) {
          setUser(user)
          setSession(session)
          await loadUserProfile(user.id)
        }
      } catch (err) {
        console.error('Error getting initial session:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to get session')
        }
      } finally {
        if (mounted) {
          setInitialLoading(false)
        }
      }
    }

    getInitialSession()

    // Set up auth state listener
    const { data: { subscription } } = authHelpers.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state changed:', event, session?.user?.id)
      
      if (session?.user) {
        setUser(session.user)
        setSession(session)
        await syncUserProfile(session.user)
        
        // Schedule automatic token refresh for new sessions
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          scheduleTokenRefresh(session)
          retryCount.current = 0 // Reset retry count on successful auth
        }
      } else {
        setUser(null)
        setSession(null)
        setUserProfile(null)
        
        // Clear any scheduled refreshes when signed out
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
          refreshTimeoutRef.current = null
        }
        
        // Handle session expiry events
        if (event === 'SIGNED_OUT' && session === null) {
          // This could be an automatic sign out due to expired session
          console.log('Session automatically expired')
        }
      }
      
      // Clear loading states on auth events
      setLoading(false)
      setInitialLoading(false)
    })

    // Cleanup
    return () => {
      mounted = false
      subscription?.unsubscribe()
      
      // Clear any pending refresh timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [loadUserProfile, syncUserProfile, scheduleTokenRefresh])

  // Context value
  const value: AuthState = {
    // State
    user,
    session,
    userProfile,
    loading,
    initialLoading,
    error,
    
    // Methods
    signUp,
    signIn,
    signInWithOtp,
    verifyOtp,
    signInWithGoogle,
    signInWithApple,
    signInWithTwitter,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export context for advanced usage
export { AuthContext }
export default AuthContext