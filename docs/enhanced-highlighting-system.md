# Enhanced Highlighting System Documentation

## Overview

The Enhanced Highlighting System (Task 10.9) provides advanced text highlighting capabilities that integrate seamlessly with the Multi-Field Search System (Task 10.8). It supports multiple colors, field-specific highlighting, phrase search, boolean operators, and comprehensive XSS protection.

## Features

### Core Capabilities
- **Multi-color highlighting** - Different colors for different search terms
- **Field-specific highlighting** - Title, content, author, and tag highlighting with different styles
- **Query type detection** - Simple, phrase, and complex boolean queries
- **XSS protection** - Secure HTML sanitization with DOMPurify
- **Smart truncation** - Context-preserving text truncation around search terms
- **Performance monitoring** - Execution time and metrics tracking
- **Accessibility support** - ARIA labels and keyboard navigation

### Integration Features
- **Task 10.8 compatibility** - Full integration with multi-field search results
- **Search context display** - Query type, execution time, and matched fields
- **Performance optimizations** - Memoization and virtual scrolling support
- **Responsive design** - Mobile-first approach with adaptive layouts

## Components

### 1. EnhancedHighlightedText

The core highlighting component with multiple color support and field-specific variants.

```tsx
import EnhancedHighlightedText, { 
  TitleHighlight, 
  ContentHighlight, 
  AuthorHighlight, 
  TagHighlight 
} from '@components/EnhancedHighlightedText';

// Basic usage
<EnhancedHighlightedText
  text="Machine learning in JavaScript applications"
  searchQuery="machine learning"
  enableMultipleColors={true}
  showMatchCount={true}
/>

// Field-specific variants
<TitleHighlight 
  text="Machine Learning Guide" 
  searchQuery="machine" 
/>
<ContentHighlight 
  text="This article discusses machine learning concepts" 
  searchQuery="machine learning" 
/>
<AuthorHighlight 
  text="John Doe" 
  searchQuery="john" 
/>
<TagHighlight 
  text="JavaScript" 
  searchQuery="script" 
/>
```

### 2. EnhancedSearchResultCard

Enhanced search result card with field-specific highlighting and advanced features.

```tsx
import EnhancedSearchResultCard from '@components/EnhancedSearchResultCard';

<EnhancedSearchResultCard
  result={enhancedSearchResult}
  searchQuery="machine learning javascript"
  showMatchedFields={true}
  showSearchContext={true}
  enableMultipleColors={true}
  enableDebugMode={false}
  onOpen={handleResultClick}
  onToggleBookmark={handleBookmarkToggle}
/>
```

### 3. EnhancedSearchResultsList

Complete search results list with advanced options and virtual scrolling.

```tsx
import EnhancedSearchResultsList from '@components/EnhancedSearchResultsList';

<EnhancedSearchResultsList
  enhancedSearchResults={searchResults}
  searchQuery="machine learning"
  enableEnhancedHighlighting={true}
  enableMultipleColors={true}
  showMatchedFields={true}
  showSearchContext={true}
  enableVirtualScrolling={true}
  onResultClick={handleResultClick}
  onToggleBookmark={handleBookmarkToggle}
  onLoadMore={handleLoadMore}
/>
```

## Utility Functions

### Core Highlighting Functions

```tsx
import {
  highlightText,
  highlightWithFieldContext,
  parseSearchQuery,
  extractTermsFromQuery,
  enhancedHighlighter
} from '@utils/enhancedHighlighting';

// Basic highlighting
const result = highlightText(
  'Machine learning in JavaScript', 
  'machine javascript',
  { maxLength: 100, enableDebug: true }
);

// Field-specific highlighting
const titleResult = highlightWithFieldContext(
  'Machine Learning Guide',
  'machine',
  'title',
  { wholeWords: true }
);

// Query analysis
const queryAnalysis = parseSearchQuery('"machine learning" AND javascript');
console.log(queryAnalysis.query_type); // 'phrase'
console.log(queryAnalysis.phrase_parts); // ['machine learning']
console.log(queryAnalysis.detected_operators); // ['AND']

// Term extraction
const terms = extractTermsFromQuery('machine AND learning OR "artificial intelligence"');
console.log(terms); // ['machine', 'learning', 'artificial intelligence', 'artificial', 'intelligence']
```

### Advanced Usage

```tsx
// Batch highlighting for performance
const results = enhancedHighlighter.batchHighlight([
  { text: 'Title: Machine Learning', fieldType: 'title' },
  { text: 'Content about ML...', fieldType: 'content' },
  { text: 'John Doe', fieldType: 'author' }
], 'machine learning');

// Custom highlight configurations
const configs = enhancedHighlighter.generateHighlightConfigs(
  ['machine', 'learning'],
  ['title', 'content']
);
```

## Configuration

### Color Schemes

The system includes predefined color schemes that can be customized:

```tsx
import { HIGHLIGHT_COLORS, HIGHLIGHT_TEXT_COLORS } from '@utils/enhancedHighlighting';

// Available color schemes
const colors = {
  primary: '#fef3c7',    // Yellow
  secondary: '#dbeafe',  // Blue
  accent: '#fed7d7',     // Red
  success: '#d1fae5',    // Green
  warning: '#fef3c7',    // Yellow
  info: '#e0e7ff',       // Indigo
  purple: '#f3e8ff',     // Purple
  pink: '#fce7f3',       // Pink
  orange: '#fed7aa',     // Orange
  neutral: '#f3f4f6'     // Gray
};
```

### Options Interface

```tsx
interface HighlightOptions {
  caseSensitive?: boolean;        // Default: false
  wholeWords?: boolean;           // Default: true
  maxLength?: number;             // Default: undefined (no limit)
  showEllipsis?: boolean;         // Default: true
  preserveWhitespace?: boolean;   // Default: false
  enableDebug?: boolean;          // Default: false
}
```

## Integration with Task 10.8

### Enhanced Search Results

The highlighting system is designed to work seamlessly with the multi-field search from Task 10.8:

```tsx
// Enhanced search result interface from Task 10.8
interface EnhancedSearchResult extends Article {
  relevance_score?: number;
  snippet?: string;
  matched_fields?: string[];     // Used by highlighting system
  search_context?: {
    query_type: 'simple' | 'phrase' | 'complex';
    normalized_query: string;
    execution_time_ms: number;
  };
}
```

### Database Integration

The highlighting system automatically uses the `matched_fields` array from the database search to:
- Apply different colors based on field priority
- Show field match indicators
- Optimize highlighting performance

### Query Type Handling

Different query types from Task 10.8 are handled specifically:

```tsx
// Simple query: "machine learning"
// - Individual word highlighting
// - Default color scheme

// Phrase query: "machine learning" AND "javascript"
// - Exact phrase highlighting
// - Multiple phrase support
// - Phrase-specific colors

// Complex query: machine AND learning OR javascript NOT python
// - Boolean operator parsing
// - Complex term extraction
// - Operator-aware highlighting
```

## Performance Considerations

### Optimization Features

1. **Memoization** - React.useMemo for expensive highlighting operations
2. **Smart truncation** - Context-preserving text truncation
3. **Virtual scrolling** - Support for large result sets
4. **Batch processing** - Efficient highlighting of multiple texts
5. **Performance monitoring** - Built-in execution time tracking

### Performance Metrics

```tsx
interface PerformanceMetrics {
  executionTime: number;    // Highlighting execution time in ms
  termCount: number;        // Number of search terms
  contentLength: number;    // Original content length
}
```

### Best Practices

1. **Use field-specific components** for better performance
2. **Enable virtual scrolling** for >50 results
3. **Limit maxLength** for very long content
4. **Use memoization** for repeated highlighting
5. **Monitor performance** in debug mode

## Security

### XSS Protection

The system uses DOMPurify to sanitize all highlighted HTML:

```tsx
// Allowed tags and attributes
const sanitizedHTML = DOMPurify.sanitize(highlightedHTML, {
  ALLOWED_TAGS: ['mark', 'span'],
  ALLOWED_ATTR: ['class', 'data-term', 'data-field'],
  ALLOW_DATA_ATTR: true
});
```

### Safe Highlighting

- All user input is escaped before regex creation
- HTML entities are properly encoded
- No script injection possible through search terms
- Sanitized output prevents XSS attacks

## Accessibility

### ARIA Support

```tsx
// Screen reader support
<span 
  role="mark"
  aria-label={`Highlighted term: ${term}`}
  className="search-highlight"
>
  {highlightedText}
</span>
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus management for complex components
- Tab order preservation
- Enter/Space key support for actions

### Color Accessibility

- High contrast color combinations
- Color-blind friendly palette
- Alternative indicators beyond color
- Customizable color schemes

## Testing

### Test Coverage

The system includes comprehensive tests for:

1. **Unit tests** - Individual utility functions
2. **Component tests** - React component rendering and interaction
3. **Integration tests** - Task 10.8 and 10.9 integration
4. **Performance tests** - Large dataset handling
5. **Accessibility tests** - ARIA and keyboard support
6. **Security tests** - XSS prevention

### Running Tests

```bash
# Run all highlighting tests
npm test -- --testPathPattern=EnhancedHighlighting

# Run with coverage
npm test -- --coverage --testPathPattern=EnhancedHighlighting

# Run specific test suite
npm test -- EnhancedHighlighting.test.tsx
```

## Examples

### Basic Implementation

```tsx
import React from 'react';
import { EnhancedSearchResultsList } from '@components/EnhancedSearchResultsList';
import { useEnhancedSearch } from '@hooks/useEnhancedSearch';

const SearchPage: React.FC = () => {
  const { searchResults, performSearch, loading } = useEnhancedSearch();
  
  return (
    <EnhancedSearchResultsList
      enhancedSearchResults={searchResults}
      searchQuery="machine learning javascript"
      loading={loading}
      enableEnhancedHighlighting={true}
      enableMultipleColors={true}
      showMatchedFields={true}
      showSearchContext={true}
      onResultClick={(result) => {
        // Navigate to article
        window.open(result.url, '_blank');
      }}
      onToggleBookmark={(result) => {
        // Toggle bookmark
      }}
    />
  );
};
```

### Custom Highlighting

```tsx
import React from 'react';
import { highlightText } from '@utils/enhancedHighlighting';

const CustomHighlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const result = highlightText(text, query, {
    maxLength: 200,
    enableDebug: true,
    caseSensitive: false
  });
  
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: result.html }} />
      {result.performance && (
        <div className="performance-info">
          Highlighted {result.matches.length} matches in {result.performance.executionTime.toFixed(1)}ms
        </div>
      )}
    </div>
  );
};
```

### Advanced Integration

```tsx
import React, { useState } from 'react';
import { 
  EnhancedSearchResultCard,
  EnhancedHighlightedText 
} from '@components/enhanced-highlighting';

const AdvancedSearchResults: React.FC = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [multipleColors, setMultipleColors] = useState(true);
  
  return (
    <div>
      {/* Controls */}
      <div className="controls">
        <label>
          <input 
            type="checkbox" 
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          Debug Mode
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={multipleColors}
            onChange={(e) => setMultipleColors(e.target.checked)}
          />
          Multiple Colors
        </label>
      </div>
      
      {/* Results */}
      {searchResults.map(result => (
        <EnhancedSearchResultCard
          key={result.id}
          result={result}
          searchQuery={searchQuery}
          enableMultipleColors={multipleColors}
          enableDebugMode={debugMode}
          showMatchedFields={true}
          showSearchContext={debugMode}
        />
      ))}
    </div>
  );
};
```

## Migration Guide

### From Basic HighlightedText

Replace existing components gradually:

```tsx
// Before (Task 10.7)
import HighlightedText from '@components/HighlightedText';

<HighlightedText
  text="Machine learning"
  searchTerms={["machine", "learning"]}
/>

// After (Task 10.9)
import { EnhancedHighlightedText } from '@components/EnhancedHighlightedText';

<EnhancedHighlightedText
  text="Machine learning"
  searchQuery="machine learning"
  enableMultipleColors={true}
/>
```

### From Basic SearchResultCard

```tsx
// Before
import SearchResultCard from '@components/SearchResultCard';

<SearchResultCard
  result={result}
  searchTerms="machine learning"
/>

// After
import EnhancedSearchResultCard from '@components/EnhancedSearchResultCard';

<EnhancedSearchResultCard
  result={enhancedResult}
  searchQuery="machine learning"
  showMatchedFields={true}
  enableMultipleColors={true}
/>
```

## Troubleshooting

### Common Issues

1. **Performance Issues**
   - Enable virtual scrolling for large datasets
   - Use memoization for repeated highlighting
   - Limit maxLength for very long content

2. **Color Issues**
   - Check HIGHLIGHT_COLORS configuration
   - Verify CSS custom properties
   - Test in dark mode

3. **Integration Issues**
   - Ensure Task 10.8 search results include matched_fields
   - Verify search_context is populated
   - Check query type detection

### Debug Mode

Enable debug mode to see detailed information:

```tsx
<EnhancedHighlightedText
  text="Machine learning"
  searchQuery="machine"
  enableDebugMode={true}
  showPerformanceInfo={true}
/>
```

## Future Enhancements

### Planned Features

1. **Fuzzy matching** - Support for typos and approximate matches
2. **Custom color schemes** - User-defined highlighting colors
3. **Highlighting templates** - Predefined highlighting patterns
4. **Export functionality** - Export highlighted results
5. **Advanced analytics** - Highlighting usage statistics

### API Improvements

1. **Streaming highlighting** - Real-time highlighting as user types
2. **Context awareness** - Smarter truncation based on content structure
3. **Multi-language support** - International text highlighting
4. **Performance dashboard** - Real-time performance monitoring

## Support

For issues and questions:

1. Check the test suite for examples
2. Review the source code comments
3. Enable debug mode for detailed information
4. Check browser console for performance metrics

## Changelog

### Version 1.0.0 (Task 10.9)
- Initial implementation of enhanced highlighting system
- Integration with Task 10.8 multi-field search
- Multiple color support
- Field-specific highlighting
- XSS protection with DOMPurify
- Comprehensive test suite
- Full documentation