// Enhanced Highlighting Utilities for Task 10.9
// Supports multi-field search from Task 10.8 with multiple colors and advanced query types

import DOMPurify from 'dompurify';

export interface HighlightConfig {
  term: string;
  color: string;
  className?: string;
  priority?: number; // Higher priority = higher specificity
}

export interface HighlightOptions {
  caseSensitive?: boolean;
  wholeWords?: boolean;
  maxLength?: number;
  showEllipsis?: boolean;
  preserveWhitespace?: boolean;
  enableDebug?: boolean;
}

export interface SearchQueryAnalysis {
  query_type: 'simple' | 'phrase' | 'complex';
  phrase_parts: string[];
  detected_operators: string[];
  word_count: number;
}

export interface EnhancedHighlightResult {
  html: string;
  matches: Array<{
    term: string;
    count: number;
    positions: number[];
  }>;
  truncated: boolean;
  performance: {
    executionTime: number;
    termCount: number;
    contentLength: number;
  };
}

// Predefined color schemes for different highlight types
export const HIGHLIGHT_COLORS = {
  primary: '#fef3c7', // Yellow
  secondary: '#dbeafe', // Blue  
  accent: '#fed7d7', // Red
  success: '#d1fae5', // Green
  warning: '#fef3c7', // Yellow
  info: '#e0e7ff', // Indigo
  neutral: '#f3f4f6', // Gray
  purple: '#f3e8ff', // Purple
  pink: '#fce7f3', // Pink
  orange: '#fed7aa', // Orange
} as const;

export const HIGHLIGHT_TEXT_COLORS = {
  primary: '#92400e',
  secondary: '#1e40af',
  accent: '#b91c1c',
  success: '#065f46',
  warning: '#92400e',
  info: '#3730a3',
  neutral: '#374151',
  purple: '#6b21a8',
  pink: '#be185d',
  orange: '#c2410c',
} as const;

/**
 * Enhanced highlighting utility class
 */
export class EnhancedHighlighter {
  private static instance: EnhancedHighlighter;
  
  private constructor() {}
  
  public static getInstance(): EnhancedHighlighter {
    if (!EnhancedHighlighter.instance) {
      EnhancedHighlighter.instance = new EnhancedHighlighter();
    }
    return EnhancedHighlighter.instance;
  }

  /**
   * Parse search query from Task 10.8 multi-field search
   */
  parseSearchQuery(query: string): SearchQueryAnalysis {
    const trimmedQuery = query.trim();
    
    // Detect phrases (quoted text)
    const phraseMatches = trimmedQuery.match(/"[^"]+"|'[^']+'/g) || [];
    const phrases = phraseMatches.map(p => p.slice(1, -1)); // Remove quotes
    
    // Detect operators
    const operatorMatches = trimmedQuery.match(/\b(AND|OR|NOT)\b|\&|\||\!/gi) || [];
    const operators = [...new Set(operatorMatches.map(op => op.toUpperCase()))];
    
    // Determine query type
    let queryType: 'simple' | 'phrase' | 'complex' = 'simple';
    if (phrases.length > 0) {
      queryType = 'phrase';
    } else if (operators.length > 0) {
      queryType = 'complex';
    }
    
    // Word count (excluding operators)
    const words = trimmedQuery
      .replace(/["']/g, '')
      .replace(/\b(AND|OR|NOT)\b|\&|\||\!/gi, '')
      .split(/\s+/)
      .filter(word => word.length > 0);

    return {
      query_type: queryType,
      phrase_parts: phrases,
      detected_operators: operators,
      word_count: words.length
    };
  }

  /**
   * Extract terms from search query for highlighting
   */
  extractTermsFromQuery(query: string, queryAnalysis?: SearchQueryAnalysis): string[] {
    const analysis = queryAnalysis || this.parseSearchQuery(query);
    const terms: string[] = [];

    if (analysis.query_type === 'phrase' && analysis.phrase_parts.length > 0) {
      // For phrase search, highlight the exact phrases
      terms.push(...analysis.phrase_parts);
      
      // Also add individual words from phrases for partial matching
      analysis.phrase_parts.forEach(phrase => {
        const words = phrase.split(/\s+/).filter(word => word.length > 2);
        terms.push(...words);
      });
    } else {
      // For simple/complex search, extract individual words
      const words = query
        .replace(/["']/g, '')
        .replace(/\b(AND|OR|NOT)\b|\&|\||\!/gi, '')
        .split(/\s+/)
        .filter(word => word.length > 1);
      terms.push(...words);
    }

    // Remove duplicates and return
    return [...new Set(terms)];
  }

  /**
   * Generate highlight configurations with multiple colors
   */
  generateHighlightConfigs(
    terms: string[], 
    matchedFields?: string[]
  ): HighlightConfig[] {
    const configs: HighlightConfig[] = [];
    const colorKeys = Object.keys(HIGHLIGHT_COLORS) as Array<keyof typeof HIGHLIGHT_COLORS>;

    terms.forEach((term, index) => {
      const colorKey = colorKeys[index % colorKeys.length];
      
      // Assign higher priority to terms that matched specific fields
      let priority = 1;
      if (matchedFields?.includes('title')) priority = 4;
      else if (matchedFields?.includes('author')) priority = 3;
      else if (matchedFields?.includes('tags')) priority = 2;

      configs.push({
        term,
        color: HIGHLIGHT_COLORS[colorKey as keyof typeof HIGHLIGHT_COLORS],
        className: `highlight-${colorKey}`,
        priority
      });
    });

    // Sort by priority (higher first) and term length (longer first)
    return configs.sort((a, b) => 
      (b.priority || 0) - (a.priority || 0) || b.term.length - a.term.length
    );
  }

  /**
   * Enhanced highlighting with multiple colors and advanced features
   */
  highlightText(
    text: string,
    searchQuery: string,
    options: HighlightOptions = {},
    matchedFields?: string[]
  ): EnhancedHighlightResult {
    const startTime = performance.now();
    
    if (!text || !searchQuery) {
      return {
        html: text || '',
        matches: [],
        truncated: false,
        performance: {
          executionTime: 0,
          termCount: 0,
          contentLength: text?.length || 0
        }
      };
    }

    const {
      caseSensitive = false,
      wholeWords = true,
      maxLength,
      showEllipsis = true,
      preserveWhitespace = false,
      enableDebug = false
    } = options;

    // Parse query and extract terms
    const queryAnalysis = this.parseSearchQuery(searchQuery);
    const terms = this.extractTermsFromQuery(searchQuery, queryAnalysis);
    const highlightConfigs = this.generateHighlightConfigs(terms, matchedFields);

    // Apply length limit if specified
    let processedText = text;
    let wasTruncated = false;

    if (maxLength && text.length > maxLength) {
      const { truncatedText, truncated } = this.smartTruncate(text, terms, maxLength, caseSensitive);
      processedText = truncatedText;
      wasTruncated = truncated;
    }

    // Apply highlighting
    const { highlightedHTML, matches } = this.applyHighlighting(
      processedText,
      highlightConfigs,
      { caseSensitive, wholeWords, preserveWhitespace }
    );

    // Add ellipsis if text was truncated
    const finalHTML = wasTruncated && showEllipsis
      ? highlightedHTML + '<span class="ellipsis">...</span>'
      : highlightedHTML;

    // Sanitize HTML to prevent XSS attacks
    const sanitizedHTML = DOMPurify.sanitize(finalHTML, {
      ALLOWED_TAGS: ['mark', 'span'],
      ALLOWED_ATTR: ['class', 'data-term', 'data-field'],
      ALLOW_DATA_ATTR: true
    });

    const executionTime = performance.now() - startTime;

    if (enableDebug) {
      console.log('Enhanced Highlighting Debug:', {
        query: searchQuery,
        queryAnalysis,
        terms,
        matches,
        executionTime: `${executionTime.toFixed(2)}ms`
      });
    }

    return {
      html: sanitizedHTML,
      matches,
      truncated: wasTruncated,
      performance: {
        executionTime,
        termCount: terms.length,
        contentLength: text.length
      }
    };
  }

  /**
   * Smart truncation that preserves search term context
   */
  private smartTruncate(
    text: string,
    terms: string[],
    maxLength: number,
    caseSensitive: boolean
  ): { truncatedText: string; truncated: boolean } {
    if (text.length <= maxLength) {
      return { truncatedText: text, truncated: false };
    }

    // Find the best position to truncate based on search terms
    let bestStartPos = 0;
    let bestScore = 0;

    for (const term of terms) {
      const searchText = caseSensitive ? text : text.toLowerCase();
      const searchTerm = caseSensitive ? term : term.toLowerCase();
      const pos = searchText.indexOf(searchTerm);
      
      if (pos !== -1) {
        // Score based on term position and context
        const contextStart = Math.max(0, pos - 50);
        const contextEnd = Math.min(text.length, pos + term.length + 50);
        const score = (text.length - pos) / text.length;
        
        if (score > bestScore && (contextEnd - contextStart) <= maxLength) {
          bestScore = score;
          bestStartPos = contextStart;
        }
      }
    }

    // Adjust to word boundaries
    while (bestStartPos > 0 && text.charAt(bestStartPos) !== ' ') {
      bestStartPos--;
    }

    let endPos = bestStartPos + maxLength;
    while (endPos > bestStartPos && endPos < text.length && text.charAt(endPos) !== ' ') {
      endPos--;
    }

    const truncatedText = text.substring(bestStartPos, endPos);
    return { 
      truncatedText, 
      truncated: text.length > endPos 
    };
  }

  /**
   * Apply highlighting with multiple colors and configurations
   */
  private applyHighlighting(
    text: string,
    configs: HighlightConfig[],
    options: { caseSensitive?: boolean; wholeWords?: boolean; preserveWhitespace?: boolean }
  ): { highlightedHTML: string; matches: Array<{ term: string; count: number; positions: number[] }> } {
    
    let highlightedText = text;
    const matches: Array<{ term: string; count: number; positions: number[] }> = [];

    // Track positions to avoid overlapping highlights
    const highlightedPositions: Array<{ start: number; end: number; priority: number }> = [];

    for (const config of configs) {
      const { term, color, className, priority = 1 } = config;
      
      if (term.trim().length < 2) continue; // Skip very short terms

      // Escape special regex characters
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create regex
      const flags = options.caseSensitive ? 'g' : 'gi';
      const pattern = options.wholeWords ? `\\b${escapedTerm}\\b` : escapedTerm;
      const regex = new RegExp(pattern, flags);

      const termMatches: number[] = [];
      let match;

      // Find all matches and their positions
      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        
        // Check if this position is already highlighted by higher priority term
        const isOverlapping = highlightedPositions.some(pos => 
          pos.priority > priority && 
          ((start >= pos.start && start < pos.end) || (end > pos.start && end <= pos.end))
        );

        if (!isOverlapping) {
          termMatches.push(start);
          highlightedPositions.push({ start, end, priority });
        }

        // Reset regex for global search
        if (regex.global) {
          if (match.index === regex.lastIndex) regex.lastIndex++;
        } else {
          break;
        }
      }

      if (termMatches.length > 0) {
        matches.push({
          term,
          count: termMatches.length,
          positions: termMatches
        });

        // Apply highlighting (replace in reverse order to maintain positions)
        const sortedMatches = [...termMatches].sort((a, b) => b - a);
        
        for (const position of sortedMatches) {
          const beforeMatch = highlightedText.substring(0, position);
          const matchedText = highlightedText.substring(position, position + term.length);
          const afterMatch = highlightedText.substring(position + term.length);

          highlightedText = beforeMatch + 
            `<mark class="search-highlight ${className || ''}" style="background-color: ${color}; color: ${this.getContrastColor(color)};" data-term="${this.escapeHtml(term)}">${matchedText}</mark>` +
            afterMatch;
        }
      }
    }

    return { highlightedHTML: highlightedText, matches };
  }

  /**
   * Get contrasting text color for background
   */
  private getContrastColor(backgroundColor: string): string {
    // Simple brightness calculation
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Highlight with field-specific context
   */
  highlightWithFieldContext(
    text: string,
    searchQuery: string,
    fieldType: 'title' | 'content' | 'author' | 'tags',
    options: HighlightOptions = {}
  ): EnhancedHighlightResult {
    // Adjust highlighting based on field type
    const enhancedOptions: HighlightOptions = {
      ...options,
      wholeWords: fieldType === 'title' || fieldType === 'author',
      maxLength: fieldType === 'title' ? 100 : fieldType === 'author' ? 50 : options.maxLength
    };

    return this.highlightText(text, searchQuery, enhancedOptions, [fieldType]);
  }

  /**
   * Batch highlight multiple texts efficiently
   */
  batchHighlight(
    texts: Array<{ text: string; fieldType?: string }>,
    searchQuery: string,
    options: HighlightOptions = {}
  ): EnhancedHighlightResult[] {
    const queryAnalysis = this.parseSearchQuery(searchQuery);
    const terms = this.extractTermsFromQuery(searchQuery, queryAnalysis);
    
    return texts.map(({ text, fieldType }) => 
      this.highlightText(text, searchQuery, options, fieldType ? [fieldType] : undefined)
    );
  }
}

// Export singleton instance
export const enhancedHighlighter = EnhancedHighlighter.getInstance();

// Utility functions
export const highlightText = (
  text: string,
  searchQuery: string,
  options?: HighlightOptions,
  matchedFields?: string[]
) => enhancedHighlighter.highlightText(text, searchQuery, options, matchedFields);

export const highlightWithFieldContext = (
  text: string,
  searchQuery: string,
  fieldType: 'title' | 'content' | 'author' | 'tags',
  options?: HighlightOptions
) => enhancedHighlighter.highlightWithFieldContext(text, searchQuery, fieldType, options);

export const parseSearchQuery = (query: string) => 
  enhancedHighlighter.parseSearchQuery(query);

export const extractTermsFromQuery = (query: string, queryAnalysis?: SearchQueryAnalysis) =>
  enhancedHighlighter.extractTermsFromQuery(query, queryAnalysis);

export default enhancedHighlighter;