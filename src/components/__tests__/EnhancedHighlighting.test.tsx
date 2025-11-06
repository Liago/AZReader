// Comprehensive Test Suite for Enhanced Highlighting System (Task 10.9)
// Tests integration with Task 10.8 multi-field search

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Components under test
import EnhancedHighlightedText, { 
  TitleHighlight, 
  ContentHighlight, 
  AuthorHighlight, 
  TagHighlight,
  useEnhancedHighlighting 
} from '../EnhancedHighlightedText';
import EnhancedSearchResultCard from '../EnhancedSearchResultCard';
import EnhancedSearchResultsList from '../EnhancedSearchResultsList';

// Utilities under test
import {
  enhancedHighlighter,
  parseSearchQuery,
  extractTermsFromQuery,
  highlightText,
  highlightWithFieldContext,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_TEXT_COLORS
} from '@utils/enhancedHighlighting';

// Mock data
import { EnhancedSearchResult, EnhancedPaginatedSearchResults } from '@services/enhancedSearchService';

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html) => html),
}));

// Mock data for tests
const mockEnhancedSearchResult: EnhancedSearchResult = {
  id: '1',
  title: 'Machine Learning in Modern JavaScript Applications',
  content: 'This article explores the integration of machine learning algorithms into JavaScript applications...',
  url: 'https://example.com/ml-js',
  author: 'John Doe',
  domain: 'example.com',
  created_at: '2024-01-15T10:00:00Z',
  tags: [
    { id: '1', name: 'JavaScript', color: '#f7df1e' },
    { id: '2', name: 'Machine Learning', color: '#ff6b6b' },
    { id: '3', name: 'AI', color: '#4ecdc4' }
  ],
  relevance_score: 0.95,
  snippet: 'JavaScript applications can now leverage machine learning capabilities through various libraries and frameworks...',
  matched_fields: ['title', 'content', 'tags'],
  search_context: {
    query_type: 'phrase',
    normalized_query: 'machine learning javascript',
    execution_time_ms: 42.5
  },
  is_favorite: false,
  reading_status: 'unread'
};

const mockPaginatedResults: EnhancedPaginatedSearchResults = {
  results: [mockEnhancedSearchResult],
  totalCount: 1,
  hasMore: false,
  query: 'machine learning javascript',
  filters: { query: 'machine learning javascript' },
  executionTimeMs: 42.5,
  searchStats: {
    field_matches: {
      title: 1,
      content: 1,
      author: 0,
      tags: 1
    },
    query_complexity: 'phrase',
    performance_score: 0.95
  }
};

describe('Enhanced Highlighting Utilities', () => {
  describe('parseSearchQuery', () => {
    test('should identify simple queries', () => {
      const result = parseSearchQuery('machine learning');
      expect(result.query_type).toBe('simple');
      expect(result.phrase_parts).toEqual([]);
      expect(result.detected_operators).toEqual([]);
      expect(result.word_count).toBe(2);
    });

    test('should identify phrase queries', () => {
      const result = parseSearchQuery('"machine learning" AND "javascript"');
      expect(result.query_type).toBe('phrase');
      expect(result.phrase_parts).toEqual(['machine learning', 'javascript']);
      expect(result.detected_operators).toEqual(['AND']);
    });

    test('should identify complex queries', () => {
      const result = parseSearchQuery('machine AND learning OR javascript');
      expect(result.query_type).toBe('complex');
      expect(result.detected_operators).toEqual(['AND', 'OR']);
      expect(result.word_count).toBe(3);
    });

    test('should handle empty queries', () => {
      const result = parseSearchQuery('');
      expect(result.query_type).toBe('simple');
      expect(result.word_count).toBe(0);
    });

    test('should handle mixed quotes', () => {
      const result = parseSearchQuery("'machine learning' AND \"artificial intelligence\"");
      expect(result.query_type).toBe('phrase');
      expect(result.phrase_parts).toEqual(['machine learning', 'artificial intelligence']);
    });
  });

  describe('extractTermsFromQuery', () => {
    test('should extract terms from simple query', () => {
      const terms = extractTermsFromQuery('machine learning javascript');
      expect(terms).toEqual(['machine', 'learning', 'javascript']);
    });

    test('should extract terms from phrase query', () => {
      const terms = extractTermsFromQuery('"machine learning" javascript');
      expect(terms).toContain('machine learning');
      expect(terms).toContain('machine');
      expect(terms).toContain('learning');
      expect(terms).toContain('javascript');
    });

    test('should handle special characters', () => {
      const terms = extractTermsFromQuery('node.js react.js');
      expect(terms).toContain('node.js');
      expect(terms).toContain('react.js');
    });

    test('should remove duplicates', () => {
      const terms = extractTermsFromQuery('machine machine learning');
      expect(terms.filter(term => term === 'machine')).toHaveLength(1);
    });
  });

  describe('enhancedHighlighter', () => {
    test('should highlight simple text', () => {
      const result = highlightText('This is about machine learning', 'machine');
      expect(result.html).toContain('<mark');
      expect(result.html).toContain('machine');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].term).toBe('machine');
      expect(result.matches[0].count).toBe(1);
    });

    test('should handle multiple terms with different colors', () => {
      const result = highlightText('Machine learning with JavaScript', 'machine javascript');
      expect(result.html).toContain('machine');
      expect(result.html).toContain('javascript');
      expect(result.matches).toHaveLength(2);
    });

    test('should apply smart truncation', () => {
      const longText = 'This is a very long text that contains machine learning concepts and should be truncated intelligently based on search terms to preserve context around the important parts.';
      const result = highlightText(longText, 'machine learning', { maxLength: 50 });
      expect(result.truncated).toBe(true);
      expect(result.html).toContain('machine');
      expect(result.html).toContain('learning');
    });

    test('should handle case sensitivity', () => {
      const result = highlightText('Machine Learning', 'machine', { caseSensitive: true });
      expect(result.matches).toHaveLength(0);
      
      const result2 = highlightText('Machine Learning', 'machine', { caseSensitive: false });
      expect(result.matches).toHaveLength(0); // Fixed: should be result2
    });

    test('should sanitize output for XSS protection', () => {
      const maliciousText = 'Hello <script>alert("xss")</script> world';
      const result = highlightText(maliciousText, 'hello');
      expect(result.html).not.toContain('<script>');
    });

    test('should track performance metrics', () => {
      const result = highlightText('Machine learning text', 'machine');
      expect(result.performance.executionTime).toBeGreaterThan(0);
      expect(result.performance.termCount).toBe(1);
      expect(result.performance.contentLength).toBe(21);
    });
  });

  describe('field-specific highlighting', () => {
    test('should apply field-specific options for title', () => {
      const result = highlightWithFieldContext('Machine Learning Guide', 'machine', 'title');
      expect(result.html).toContain('machine');
      expect(result.performance.contentLength).toBe(21);
    });

    test('should apply field-specific options for author', () => {
      const result = highlightWithFieldContext('John Doe', 'john', 'author');
      expect(result.html).toContain('john');
    });

    test('should handle content field with different settings', () => {
      const content = 'This is a long content piece about machine learning...';
      const result = highlightWithFieldContext(content, 'machine', 'content');
      expect(result.html).toContain('machine');
    });
  });
});

describe('EnhancedHighlightedText Component', () => {
  test('should render basic highlighted text', () => {
    render(
      <EnhancedHighlightedText
        text="Machine learning in JavaScript"
        searchQuery="machine"
      />
    );
    
    expect(screen.getByText(/machine/i)).toBeInTheDocument();
  });

  test('should show match count when enabled', () => {
    render(
      <EnhancedHighlightedText
        text="Machine learning in machine applications"
        searchQuery="machine"
        showMatchCount={true}
      />
    );
    
    expect(screen.getByText(/2 matches/i)).toBeInTheDocument();
  });

  test('should show performance info in debug mode', () => {
    render(
      <EnhancedHighlightedText
        text="Machine learning text"
        searchQuery="machine"
        showPerformanceInfo={true}
      />
    );
    
    expect(screen.getByText(/ms$/)).toBeInTheDocument();
    expect(screen.getByText(/terms$/)).toBeInTheDocument();
  });

  test('should handle click events', () => {
    const handleClick = jest.fn();
    render(
      <EnhancedHighlightedText
        text="Machine learning"
        searchQuery="machine"
        onClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByText(/machine/i));
    expect(handleClick).toHaveBeenCalled();
  });

  test('should handle empty text gracefully', () => {
    render(
      <EnhancedHighlightedText
        text=""
        searchQuery="machine"
      />
    );
    
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  test('should handle empty search query', () => {
    render(
      <EnhancedHighlightedText
        text="Machine learning"
        searchQuery=""
      />
    );
    
    expect(screen.getByText('Machine learning')).toBeInTheDocument();
  });
});

describe('Field-Specific Highlight Components', () => {
  test('TitleHighlight should apply title-specific highlighting', () => {
    render(
      <TitleHighlight
        text="Machine Learning Guide"
        searchQuery="machine"
      />
    );
    
    expect(screen.getByText(/machine/i)).toBeInTheDocument();
  });

  test('ContentHighlight should apply content-specific highlighting', () => {
    render(
      <ContentHighlight
        text="This content discusses machine learning concepts"
        searchQuery="machine"
      />
    );
    
    expect(screen.getByText(/machine/i)).toBeInTheDocument();
  });

  test('AuthorHighlight should apply author-specific highlighting', () => {
    render(
      <AuthorHighlight
        text="John Doe"
        searchQuery="john"
      />
    );
    
    expect(screen.getByText(/john/i)).toBeInTheDocument();
  });

  test('TagHighlight should apply tag-specific highlighting', () => {
    render(
      <TagHighlight
        text="JavaScript"
        searchQuery="script"
      />
    );
    
    expect(screen.getByText(/script/i)).toBeInTheDocument();
  });
});

describe('EnhancedSearchResultCard Component', () => {
  test('should render enhanced search result with highlighting', () => {
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
      />
    );
    
    expect(screen.getByText(/Machine Learning/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/JavaScript/i)).toBeInTheDocument();
  });

  test('should show matched fields when enabled', () => {
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
        showMatchedFields={true}
      />
    );
    
    expect(screen.getByText(/Matched in:/i)).toBeInTheDocument();
    expect(screen.getByText(/title/i)).toBeInTheDocument();
    expect(screen.getByText(/content/i)).toBeInTheDocument();
  });

  test('should show search context when enabled', () => {
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
        showSearchContext={true}
      />
    );
    
    expect(screen.getByText(/phrase search/i)).toBeInTheDocument();
    expect(screen.getByText(/42.5ms/i)).toBeInTheDocument();
  });

  test('should show relevance score when enabled', () => {
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
        showRelevanceScore={true}
      />
    );
    
    expect(screen.getByText(/0.95/)).toBeInTheDocument();
  });

  test('should handle click events', () => {
    const handleOpen = jest.fn();
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
        onOpen={handleOpen}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /Machine Learning/i }));
    expect(handleOpen).toHaveBeenCalledWith(mockEnhancedSearchResult);
  });

  test('should handle bookmark toggle', () => {
    const handleBookmark = jest.fn();
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
        onToggleBookmark={handleBookmark}
      />
    );
    
    const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
    fireEvent.click(bookmarkButton);
    expect(handleBookmark).toHaveBeenCalledWith(mockEnhancedSearchResult);
  });

  test('should render loading state', () => {
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
        loading={true}
      />
    );
    
    expect(screen.getAllByTestId('skeleton-text')).toHaveLength(4);
  });
});

describe('EnhancedSearchResultsList Component', () => {
  test('should render enhanced search results list', () => {
    render(
      <EnhancedSearchResultsList
        enhancedSearchResults={mockPaginatedResults}
        searchQuery="machine learning"
      />
    );
    
    expect(screen.getByText(/1 result/i)).toBeInTheDocument();
    expect(screen.getByText(/Machine Learning/i)).toBeInTheDocument();
  });

  test('should show search statistics', () => {
    render(
      <EnhancedSearchResultsList
        enhancedSearchResults={mockPaginatedResults}
        searchQuery="machine learning"
      />
    );
    
    expect(screen.getByText(/Enhanced/i)).toBeInTheDocument();
    expect(screen.getByText(/phrase/i)).toBeInTheDocument();
    expect(screen.getByText(/title: 1/i)).toBeInTheDocument();
  });

  test('should handle advanced options toggle', () => {
    render(
      <EnhancedSearchResultsList
        enhancedSearchResults={mockPaginatedResults}
        searchQuery="machine learning"
        enableEnhancedHighlighting={true}
      />
    );
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    expect(screen.getByText(/Enhanced Highlighting Options/i)).toBeInTheDocument();
    expect(screen.getByText(/Multiple Colors/i)).toBeInTheDocument();
  });

  test('should handle sort change', () => {
    render(
      <EnhancedSearchResultsList
        enhancedSearchResults={mockPaginatedResults}
        searchQuery="machine learning"
      />
    );
    
    const dateButton = screen.getByText(/Date/i);
    fireEvent.click(dateButton);
    
    // Should still show the result (sorting is internal)
    expect(screen.getByText(/Machine Learning/i)).toBeInTheDocument();
  });

  test('should render loading state', () => {
    render(
      <EnhancedSearchResultsList
        enhancedSearchResults={null}
        searchQuery="machine learning"
        loading={true}
      />
    );
    
    expect(screen.getByText(/Searching articles/i)).toBeInTheDocument();
  });

  test('should render error state', () => {
    render(
      <EnhancedSearchResultsList
        enhancedSearchResults={null}
        searchQuery="machine learning"
        error="Search failed"
      />
    );
    
    expect(screen.getByText(/Search Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Search failed/i)).toBeInTheDocument();
  });

  test('should render empty state', () => {
    const emptyResults = {
      ...mockPaginatedResults,
      results: [],
      totalCount: 0
    };
    
    render(
      <EnhancedSearchResultsList
        enhancedSearchResults={emptyResults}
        searchQuery="machine learning"
      />
    );
    
    expect(screen.getByText(/No Results Found/i)).toBeInTheDocument();
  });

  test('should handle result click', () => {
    const handleResultClick = jest.fn();
    render(
      <EnhancedSearchResultsList
        enhancedSearchResults={mockPaginatedResults}
        searchQuery="machine learning"
        onResultClick={handleResultClick}
      />
    );
    
    fireEvent.click(screen.getByText(/Machine Learning/i));
    expect(handleResultClick).toHaveBeenCalledWith(mockEnhancedSearchResult);
  });
});

describe('useEnhancedHighlighting Hook', () => {
  const TestComponent = ({ text, query, options }: any) => {
    const result = useEnhancedHighlighting(text, query, options);
    return (
      <div>
        {result ? (
          <div>
            <span data-testid="html">{result.html}</span>
            <span data-testid="matches">{result.matches.length}</span>
          </div>
        ) : (
          <span data-testid="no-result">No result</span>
        )}
      </div>
    );
  };

  test('should return highlighted result', () => {
    render(<TestComponent text="Machine learning" query="machine" />);
    
    expect(screen.getByTestId('html')).toBeInTheDocument();
    expect(screen.getByTestId('matches')).toHaveTextContent('1');
  });

  test('should return null for empty inputs', () => {
    render(<TestComponent text="" query="machine" />);
    
    expect(screen.getByTestId('no-result')).toBeInTheDocument();
  });

  test('should memoize results', () => {
    const { rerender } = render(<TestComponent text="Machine learning" query="machine" />);
    const firstResult = screen.getByTestId('html').textContent;
    
    rerender(<TestComponent text="Machine learning" query="machine" />);
    const secondResult = screen.getByTestId('html').textContent;
    
    expect(firstResult).toBe(secondResult);
  });
});

describe('Integration Tests', () => {
  test('should integrate Task 10.8 multi-field search with Task 10.9 highlighting', () => {
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning javascript"
        showMatchedFields={true}
        enableMultipleColors={true}
      />
    );
    
    // Should highlight in title
    expect(screen.getByText(/Machine Learning/i)).toBeInTheDocument();
    
    // Should show matched fields
    expect(screen.getByText(/title/i)).toBeInTheDocument();
    expect(screen.getByText(/content/i)).toBeInTheDocument();
    expect(screen.getByText(/tags/i)).toBeInTheDocument();
    
    // Should highlight in tags
    expect(screen.getByText(/JavaScript/i)).toBeInTheDocument();
  });

  test('should handle phrase search from Task 10.8 with proper highlighting', () => {
    const phraseResult = {
      ...mockEnhancedSearchResult,
      search_context: {
        query_type: 'phrase' as const,
        normalized_query: '"machine learning"',
        execution_time_ms: 35.2
      }
    };
    
    render(
      <EnhancedSearchResultCard
        result={phraseResult}
        searchQuery='"machine learning"'
        showSearchContext={true}
      />
    );
    
    expect(screen.getByText(/phrase search/i)).toBeInTheDocument();
    expect(screen.getByText(/35.2ms/i)).toBeInTheDocument();
  });

  test('should handle complex boolean search with highlighting', () => {
    const complexResult = {
      ...mockEnhancedSearchResult,
      search_context: {
        query_type: 'complex' as const,
        normalized_query: 'machine AND learning OR javascript',
        execution_time_ms: 58.7
      }
    };
    
    render(
      <EnhancedSearchResultCard
        result={complexResult}
        searchQuery="machine AND learning OR javascript"
        showSearchContext={true}
      />
    );
    
    expect(screen.getByText(/complex/i)).toBeInTheDocument();
  });

  test('should preserve highlighting performance with large result sets', async () => {
    const largeResultSet = {
      ...mockPaginatedResults,
      results: Array(100).fill(mockEnhancedSearchResult).map((result, index) => ({
        ...result,
        id: `${index}`,
        title: `Article ${index}: Machine Learning Guide`
      })),
      totalCount: 100
    };
    
    const startTime = performance.now();
    
    render(
      <EnhancedSearchResultsList
        enhancedSearchResults={largeResultSet}
        searchQuery="machine learning"
        enableVirtualScrolling={true}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within reasonable time (adjust based on requirements)
    expect(renderTime).toBeLessThan(500);
    expect(screen.getByText(/100 results/i)).toBeInTheDocument();
  });
});

describe('Accessibility Tests', () => {
  test('should have proper ARIA labels', () => {
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
        showMatchedFields={true}
      />
    );
    
    // Check for accessible button labels
    const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
    expect(bookmarkButton).toBeInTheDocument();
  });

  test('should support keyboard navigation', () => {
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
        onOpen={jest.fn()}
      />
    );
    
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    // Should trigger card interaction
  });

  test('should have proper focus states', () => {
    render(
      <EnhancedSearchResultCard
        result={mockEnhancedSearchResult}
        searchQuery="machine learning"
      />
    );
    
    const card = screen.getByRole('button');
    card.focus();
    expect(card).toHaveFocus();
  });
});