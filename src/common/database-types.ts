// AZReader Database Types
// Generated from database schema - keep in sync with actual database structure

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          auth_provider: string | null
          bio: string | null
          website: string | null
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          auth_provider?: string | null
          bio?: string | null
          website?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          auth_provider?: string | null
          bio?: string | null
          website?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      articles: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string
          content: string | null
          excerpt: string | null
          image_url: string | null
          favicon_url: string | null
          author: string | null
          published_date: string | null
          domain: string | null
          tags: string[] | null
          is_favorite: boolean | null
          like_count: number | null
          comment_count: number | null
          reading_status: 'unread' | 'reading' | 'completed' | null
          estimated_read_time: number | null
          is_public: boolean | null
          scraped_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          title: string
          content?: string | null
          excerpt?: string | null
          image_url?: string | null
          favicon_url?: string | null
          author?: string | null
          published_date?: string | null
          domain?: string | null
          tags?: string[] | null
          is_favorite?: boolean | null
          like_count?: number | null
          comment_count?: number | null
          reading_status?: 'unread' | 'reading' | 'completed' | null
          estimated_read_time?: number | null
          is_public?: boolean | null
          scraped_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          title?: string
          content?: string | null
          excerpt?: string | null
          image_url?: string | null
          favicon_url?: string | null
          author?: string | null
          published_date?: string | null
          domain?: string | null
          tags?: string[] | null
          is_favorite?: boolean | null
          like_count?: number | null
          comment_count?: number | null
          reading_status?: 'unread' | 'reading' | 'completed' | null
          estimated_read_time?: number | null
          is_public?: boolean | null
          scraped_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          article_id: string
          user_id: string
          parent_id: string | null
          content: string
          is_edited: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          article_id: string
          user_id: string
          parent_id?: string | null
          content: string
          is_edited?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          article_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          is_edited?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: {
          id: string
          article_id: string
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          article_id: string
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          article_id?: string
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reading_log: {
        Row: {
          id: string
          user_id: string
          article_id: string
          read_at: string | null
          duration_seconds: number | null
          progress_percentage: number | null
          device_info: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          read_at?: string | null
          duration_seconds?: number | null
          progress_percentage?: number | null
          device_info?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          read_at?: string | null
          duration_seconds?: number | null
          progress_percentage?: number | null
          device_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_log_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_log_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string | null
          usage_count: number | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          usage_count?: number | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          usage_count?: number | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      article_tags: {
        Row: {
          id: string
          article_id: string
          tag_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          article_id: string
          tag_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          article_id?: string
          tag_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme_mode: 'light' | 'dark' | 'system' | null
          reading_font_family: string | null
          reading_font_size: number | null
          reading_line_height: number | null
          reading_width: 'narrow' | 'medium' | 'wide' | null
          auto_mark_read: boolean | null
          notifications_enabled: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          theme_mode?: 'light' | 'dark' | 'system' | null
          reading_font_family?: string | null
          reading_font_size?: number | null
          reading_line_height?: number | null
          reading_width?: 'narrow' | 'medium' | 'wide' | null
          auto_mark_read?: boolean | null
          notifications_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          theme_mode?: 'light' | 'dark' | 'system' | null
          reading_font_family?: string | null
          reading_font_size?: number | null
          reading_line_height?: number | null
          reading_width?: 'narrow' | 'medium' | 'wide' | null
          auto_mark_read?: boolean | null
          notifications_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_feed: {
        Args: {
          user_id: string
          page_size?: number
          page_offset?: number
        }
        Returns: {
          article_id: string
          title: string
          excerpt: string | null
          image_url: string | null
          author: string | null
          domain: string | null
          published_date: string | null
          created_at: string | null
          like_count: number
          comment_count: number
          user_name: string | null
          user_avatar_url: string | null
        }[]
      }
      extract_domain: {
        Args: {
          url: string
        }
        Returns: string | null
      }
      calculate_reading_time: {
        Args: {
          content: string
        }
        Returns: number | null
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Article = Database['public']['Tables']['articles']['Row']
export type ArticleInsert = Database['public']['Tables']['articles']['Insert']
export type ArticleUpdate = Database['public']['Tables']['articles']['Update']

export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']
export type CommentUpdate = Database['public']['Tables']['comments']['Update']

export type Like = Database['public']['Tables']['likes']['Row']
export type LikeInsert = Database['public']['Tables']['likes']['Insert']

export type ReadingLog = Database['public']['Tables']['reading_log']['Row']
export type ReadingLogInsert = Database['public']['Tables']['reading_log']['Insert']
export type ReadingLogUpdate = Database['public']['Tables']['reading_log']['Update']

export type UserFollow = Database['public']['Tables']['user_follows']['Row']
export type UserFollowInsert = Database['public']['Tables']['user_follows']['Insert']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type TagUpdate = Database['public']['Tables']['tags']['Update']

export type ArticleTag = Database['public']['Tables']['article_tags']['Row']
export type ArticleTagInsert = Database['public']['Tables']['article_tags']['Insert']

export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert']
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update']

// Enums for type safety
export type ReadingStatus = 'unread' | 'reading' | 'completed'
export type ThemeMode = 'light' | 'dark' | 'system'
export type ReadingWidth = 'narrow' | 'medium' | 'wide'

// Extended types with relations
export interface ArticleWithUser extends Article {
  user: User
}

export interface CommentWithUser extends Comment {
  user: User
  replies?: CommentWithUser[]
}

export interface ArticleWithMetadata extends Article {
  user: User
  is_liked?: boolean
  reading_progress?: number
  tags_normalized?: Tag[]
}