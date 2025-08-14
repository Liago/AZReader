# AZReader Database Optimization Analysis
## Task 10.6: Performance Optimization for Search Functionality

### Current Database Schema Analysis

#### Core Tables for Search Operations

1. **articles** - Primary search target
   - `title` (string) - Full-text search target
   - `content` (string | null) - Full-text search target
   - `author` (string | null) - Search field
   - `domain` (string | null) - Filter field
   - `tags` (string[] | null) - Filter field (array)
   - `reading_status` - Filter field
   - `created_at` - Sort/filter field
   - `published_date` - Sort/filter field
   - `is_favorite` - Filter field
   - `user_id` - Partition field (RLS)

2. **tags** - Tag-based search/filtering
   - `name` (string) - Search field
   - `usage_count` - Sort field

3. **article_tags** - Many-to-many relation
   - `article_id` - Join field
   - `tag_id` - Join field

### Current SearchService RPC Functions

From SearchService analysis, these functions need optimization:

1. **search_articles** - Main search function
   - Parameters: user_id, search_query, tag_ids, include_read, date_from, date_to, domain_filter, sort_by, limit, offset
   - Currently missing - needs to be created

2. **get_search_suggestions** - Autocomplete suggestions
   - Parameters: user_id, query_prefix, suggestion_limit
   - Currently missing - needs to be created

3. **get_search_statistics** - Search analytics
   - Parameters: user_id, days_back
   - Currently missing - needs to be created

4. **generate_search_snippet** - Content snippets with highlighting
   - Parameters: content_text, search_query, snippet_length, highlight_tag
   - Currently missing - needs to be created

5. **log_search_query** - Search analytics logging
   - Parameters: user_id, query_text, result_count, execution_time, filters
   - Currently missing - needs to be created

### Missing Tables for Search Analytics

From SearchService analysis, we need:

1. **search_queries** table for analytics
   - user_id
   - query_text
   - result_count
   - execution_time_ms
   - filters_data (JSON)
   - created_at

### Performance Optimization Priorities

#### 1. Full-Text Search Indices (High Priority)
- **Primary Index**: `articles(title, content)` with PostgreSQL Full-Text Search
- **Secondary Index**: `articles(author)` for author searches
- **Weight Configuration**: title > content for relevance scoring

#### 2. Composite Indices for Filtered Searches (High Priority)
- `articles(user_id, reading_status, created_at)` - User + status + date filters
- `articles(user_id, domain, created_at)` - User + domain + date filters
- `articles(user_id, is_favorite, created_at)` - User + favorites + date
- `article_tags(tag_id, article_id)` - Tag-based filtering
- `tags(name, usage_count)` - Tag autocomplete

#### 3. Date Range Indices (Medium Priority)
- `articles(created_at, user_id)` - Date range queries
- `articles(published_date, user_id)` - Published date filtering

#### 4. Search Analytics Indices (Medium Priority)
- `search_queries(user_id, created_at)` - Analytics queries
- `search_queries(query_text, user_id)` - Query frequency analysis

### Query Optimization Strategy

#### EXPLAIN ANALYZE Targets
1. Main search query with filters
2. Tag-based search queries
3. Autocomplete suggestion queries
4. Search analytics aggregations

#### Caching Strategy
1. **Popular Search Results** - Cache top 100 search queries for 15 minutes
2. **Search Suggestions** - Cache autocomplete results for 5 minutes
3. **Search Statistics** - Cache user stats for 1 hour
4. **Tag Data** - Cache tag list and counts for 30 minutes

### Implementation Plan

#### Phase 1: Database Functions (Missing - High Priority)
1. Create `search_articles` function with full-text search
2. Create `get_search_suggestions` function
3. Create search analytics functions
4. Create search_queries table

#### Phase 2: Index Creation (High Priority)
1. Full-text search indices
2. Composite filtering indices
3. Foreign key optimization

#### Phase 3: Caching Layer (Medium Priority)
1. Redis cache integration or localStorage fallback
2. Cache invalidation strategy
3. Cache warming for popular queries

#### Phase 4: Monitoring (Low Priority)
1. Query performance monitoring
2. Slow query alerts
3. Search analytics dashboard

### Expected Performance Improvements

- **Search Response Time**: < 200ms for most queries
- **Autocomplete Response**: < 50ms 
- **Large Dataset Performance**: Support for 10k+ articles per user
- **Concurrent Users**: Support for 100+ concurrent searches

### Risk Assessment

- **Index Size**: Full-text indices may increase storage by 20-30%
- **Write Performance**: Additional indices may slow inserts by 10-15%
- **Cache Memory**: Caching layer requires additional memory allocation
- **Complexity**: Additional maintenance for index management