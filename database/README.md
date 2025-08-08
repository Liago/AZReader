# AZReader Database Schema

This directory contains the complete database schema and migration files for the AZReader application.

## Database Structure

### Core Tables

1. **users** - User profiles (extends Supabase auth.users)
2. **articles** - Saved articles with full metadata
3. **comments** - Article comments with threading support
4. **likes** - Article likes/reactions
5. **reading_log** - Reading progress and history tracking
6. **user_follows** - Social following relationships
7. **tags** - Tag management and statistics
8. **article_tags** - Many-to-many relationship between articles and tags
9. **user_preferences** - User reading preferences and settings

### Key Features

- **Row Level Security (RLS)** - All tables have comprehensive security policies
- **Full-text search** - Articles are indexed for fast text search
- **Performance indexes** - Optimized for common query patterns
- **Automatic triggers** - Keep counts and metadata in sync
- **Social features** - Following, likes, comments with proper permissions

## Migration Files

- `01_initial_schema.sql` - Core table definitions and indexes
- `02_row_level_security.sql` - RLS policies for all tables
- `03_functions_and_triggers.sql` - Utility functions and triggers
- `run_migrations.sql` - Complete migration script (all-in-one)

## Setup Instructions

### Option 1: Run Complete Migration (Recommended)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `run_migrations.sql`
4. Run the query

### Option 2: Run Individual Migration Files

Run the files in order:

1. `01_initial_schema.sql`
2. `02_row_level_security.sql`
3. `03_functions_and_triggers.sql`

## Testing the Schema

After running migrations, you can test with these queries:

```sql
-- Test user creation
INSERT INTO users (id, email, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User');

-- Test article creation
INSERT INTO articles (user_id, url, title, content, tags) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'https://example.com/article',
    'Test Article',
    'This is test content for the article.',
    ARRAY['tech', 'testing']
);

-- Test RLS policies (should only return user's own articles when authenticated)
SELECT * FROM articles;
```

## Schema Validation

To verify everything was created correctly:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'articles', 'comments', 'likes', 'reading_log', 'user_follows', 'tags', 'article_tags', 'user_preferences');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'articles', 'comments', 'likes', 'reading_log', 'user_follows', 'tags', 'article_tags', 'user_preferences');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

## Security Notes

- All tables have Row Level Security enabled
- Users can only access their own data and public content
- Authentication is handled via Supabase Auth
- All foreign keys properly cascade deletes
- Input validation via CHECK constraints

## Performance Considerations

- Full-text search indexes on articles
- Composite indexes for common query patterns
- GIN indexes for array fields (tags)
- Proper foreign key indexes for joins