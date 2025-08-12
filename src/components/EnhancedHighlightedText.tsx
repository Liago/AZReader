// Enhanced HighlightedText Component for Task 10.9
// Supports multi-field search highlighting with multiple colors and advanced features

import React, { useMemo } from 'react';
import { 
  enhancedHighlighter, 
  HighlightOptions, 
  EnhancedHighlightResult,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_TEXT_COLORS
} from '@utils/enhancedHighlighting';

export interface EnhancedHighlightedTextProps {
  text: string;
  searchQuery: string;
  fieldType?: 'title' | 'content' | 'author' | 'tags';
  matchedFields?: string[];
  className?: string;
  options?: HighlightOptions;
  showMatchCount?: boolean;
  showPerformanceInfo?: boolean;
  enableMultipleColors?: boolean;
  onClick?: (matchInfo: EnhancedHighlightResult) => void;
  onDoubleClick?: (matchInfo: EnhancedHighlightResult) => void;
}

const EnhancedHighlightedText: React.FC<EnhancedHighlightedTextProps> = ({
  text,
  searchQuery,
  fieldType,
  matchedFields,
  className = '',
  options = {},
  showMatchCount = false,
  showPerformanceInfo = false,
  enableMultipleColors = true,
  onClick,
  onDoubleClick
}) => {
  // Memoize highlighting result for performance
  const highlightResult = useMemo(() => {
    if (!text || !searchQuery) {
      return {
        html: text || '',
        matches: [],
        truncated: false,
        performance: { executionTime: 0, termCount: 0, contentLength: text?.length || 0 }
      };
    }

    if (fieldType) {
      return enhancedHighlighter.highlightWithFieldContext(text, searchQuery, fieldType, options);
    } else {
      return enhancedHighlighter.highlightText(text, searchQuery, options, matchedFields);
    }
  }, [text, searchQuery, fieldType, matchedFields, options]);

  // Handle clicks if provided
  const handleClick = () => {
    if (onClick) {
      onClick(highlightResult);
    }
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(highlightResult);
    }
  };

  // Calculate total matches
  const totalMatches = highlightResult.matches.reduce((sum, match) => sum + match.count, 0);

  // Generate CSS variables for multiple colors
  const cssVariables = useMemo(() => {
    const variables: React.CSSProperties = {};
    
    if (enableMultipleColors) {
      Object.entries(HIGHLIGHT_COLORS).forEach(([key, color]) => {
        variables[`--highlight-${key}-bg` as any] = color;
        variables[`--highlight-${key}-color` as any] = HIGHLIGHT_TEXT_COLORS[key as keyof typeof HIGHLIGHT_TEXT_COLORS];
      });
    }
    
    return variables;
  }, [enableMultipleColors]);

  return (
    <div className={`enhanced-highlighted-text ${className}`}>
      {/* Main highlighted content */}
      <span
        className={`highlighted-content ${onClick ? 'clickable' : ''}`}
        dangerouslySetInnerHTML={{ __html: highlightResult.html }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={cssVariables}
      />
      
      {/* Match count indicator */}
      {showMatchCount && totalMatches > 0 && (
        <span className="match-count-indicator">
          <span className="match-count-badge">
            {totalMatches} match{totalMatches !== 1 ? 'es' : ''}
          </span>
        </span>
      )}

      {/* Performance info (debug mode) */}
      {showPerformanceInfo && (
        <div className="performance-info">
          <span className="performance-badge">
            {highlightResult.performance.executionTime.toFixed(1)}ms
          </span>
          <span className="terms-badge">
            {highlightResult.performance.termCount} terms
          </span>
          {highlightResult.truncated && (
            <span className="truncated-badge">truncated</span>
          )}
        </div>
      )}

      <style>{`
        .enhanced-highlighted-text {
          position: relative;
          display: inline;
        }

        .highlighted-content {
          line-height: 1.4;
          word-wrap: break-word;
        }

        .highlighted-content.clickable {
          cursor: pointer;
        }

        /* Base highlight styles */
        .highlighted-content .search-highlight {
          font-weight: 600;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
          transition: all 0.2s ease;
          position: relative;
        }

        /* Multiple color support */
        .highlighted-content .search-highlight.highlight-primary {
          background-color: var(--highlight-primary-bg, ${HIGHLIGHT_COLORS.primary});
          color: var(--highlight-primary-color, ${HIGHLIGHT_TEXT_COLORS.primary});
        }

        .highlighted-content .search-highlight.highlight-secondary {
          background-color: var(--highlight-secondary-bg, ${HIGHLIGHT_COLORS.secondary});
          color: var(--highlight-secondary-color, ${HIGHLIGHT_TEXT_COLORS.secondary});
        }

        .highlighted-content .search-highlight.highlight-accent {
          background-color: var(--highlight-accent-bg, ${HIGHLIGHT_COLORS.accent});
          color: var(--highlight-accent-color, ${HIGHLIGHT_TEXT_COLORS.accent});
        }

        .highlighted-content .search-highlight.highlight-success {
          background-color: var(--highlight-success-bg, ${HIGHLIGHT_COLORS.success});
          color: var(--highlight-success-color, ${HIGHLIGHT_TEXT_COLORS.success});
        }

        .highlighted-content .search-highlight.highlight-warning {
          background-color: var(--highlight-warning-bg, ${HIGHLIGHT_COLORS.warning});
          color: var(--highlight-warning-color, ${HIGHLIGHT_TEXT_COLORS.warning});
        }

        .highlighted-content .search-highlight.highlight-info {
          background-color: var(--highlight-info-bg, ${HIGHLIGHT_COLORS.info});
          color: var(--highlight-info-color, ${HIGHLIGHT_TEXT_COLORS.info});
        }

        .highlighted-content .search-highlight.highlight-purple {
          background-color: var(--highlight-purple-bg, ${HIGHLIGHT_COLORS.purple});
          color: var(--highlight-purple-color, ${HIGHLIGHT_TEXT_COLORS.purple});
        }

        .highlighted-content .search-highlight.highlight-pink {
          background-color: var(--highlight-pink-bg, ${HIGHLIGHT_COLORS.pink});
          color: var(--highlight-pink-color, ${HIGHLIGHT_TEXT_COLORS.pink});
        }

        .highlighted-content .search-highlight.highlight-orange {
          background-color: var(--highlight-orange-bg, ${HIGHLIGHT_COLORS.orange});
          color: var(--highlight-orange-color, ${HIGHLIGHT_TEXT_COLORS.orange});
        }

        /* Hover effects */
        .highlighted-content .search-highlight:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          z-index: 1;
        }

        /* Field-specific styling */
        .enhanced-highlighted-text[data-field-type="title"] .search-highlight {
          font-weight: 700;
          padding: 0.125rem 0.375rem;
        }

        .enhanced-highlighted-text[data-field-type="author"] .search-highlight {
          font-style: italic;
          border-radius: 12px;
        }

        .enhanced-highlighted-text[data-field-type="tags"] .search-highlight {
          border-radius: 12px;
          font-size: 0.875em;
        }

        /* Match count indicator */
        .match-count-indicator {
          margin-left: 0.5rem;
          display: inline-block;
        }

        .match-count-badge {
          background-color: var(--ion-color-primary, #3880ff);
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          border-radius: 12px;
          font-weight: 500;
        }

        /* Performance info */
        .performance-info {
          margin-left: 0.5rem;
          display: inline-flex;
          gap: 0.25rem;
          font-size: 0.75rem;
        }

        .performance-badge,
        .terms-badge,
        .truncated-badge {
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }

        .performance-badge {
          background-color: #f0f9ff;
          color: #0369a1;
        }

        .terms-badge {
          background-color: #f0fdf4;
          color: #15803d;
        }

        .truncated-badge {
          background-color: #fef3c7;
          color: #92400e;
        }

        /* Ellipsis styling */
        .highlighted-content .ellipsis {
          color: var(--ion-color-medium, #666);
          font-style: italic;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .highlighted-content .search-highlight {
            filter: brightness(0.8);
          }

          .match-count-badge {
            background-color: var(--ion-color-primary-shade, #3171e0);
          }

          .performance-badge {
            background-color: #1e3a8a;
            color: #93c5fd;
          }

          .terms-badge {
            background-color: #14532d;
            color: #86efac;
          }

          .truncated-badge {
            background-color: #451a03;
            color: #fbbf24;
          }
        }

        /* Ionic dark mode */
        .ios.dark .highlighted-content .search-highlight,
        .md.dark .highlighted-content .search-highlight {
          filter: brightness(0.8);
        }

        .ios.dark .match-count-badge,
        .md.dark .match-count-badge {
          background-color: var(--ion-color-primary-shade, #3171e0);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .highlighted-content .search-highlight {
            padding: 0.1rem 0.2rem;
            font-size: 0.95em;
          }

          .match-count-indicator,
          .performance-info {
            margin-left: 0.25rem;
          }

          .performance-info {
            flex-direction: column;
            gap: 0.125rem;
          }
        }

        /* Animation for new highlights */
        @keyframes highlightAppear {
          from {
            background-color: transparent;
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          to {
            transform: scale(1);
          }
        }

        .highlighted-content .search-highlight.animate-in {
          animation: highlightAppear 0.5s ease-out;
        }

        /* Focus states for accessibility */
        .highlighted-content .search-highlight:focus {
          outline: 2px solid var(--ion-color-primary, #3880ff);
          outline-offset: 2px;
        }

        /* Print styles */
        @media print {
          .highlighted-content .search-highlight {
            background-color: #ffffcc !important;
            color: #000000 !important;
            font-weight: bold;
          }

          .match-count-indicator,
          .performance-info {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

// Hook for using enhanced highlighting in other components
export const useEnhancedHighlighting = (
  text: string,
  searchQuery: string,
  options?: HighlightOptions
) => {
  return useMemo(() => {
    if (!text || !searchQuery) return null;
    return enhancedHighlighter.highlightText(text, searchQuery, options);
  }, [text, searchQuery, options]);
};

// Component variants for specific use cases
export const TitleHighlight: React.FC<Omit<EnhancedHighlightedTextProps, 'fieldType'>> = (props) => (
  <EnhancedHighlightedText {...props} fieldType="title" />
);

export const ContentHighlight: React.FC<Omit<EnhancedHighlightedTextProps, 'fieldType'>> = (props) => (
  <EnhancedHighlightedText {...props} fieldType="content" />
);

export const AuthorHighlight: React.FC<Omit<EnhancedHighlightedTextProps, 'fieldType'>> = (props) => (
  <EnhancedHighlightedText {...props} fieldType="author" />
);

export const TagHighlight: React.FC<Omit<EnhancedHighlightedTextProps, 'fieldType'>> = (props) => (
  <EnhancedHighlightedText {...props} fieldType="tags" />
);

export default EnhancedHighlightedText;