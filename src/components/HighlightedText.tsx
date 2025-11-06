import React from 'react';
import DOMPurify from 'dompurify';

export interface HighlightedTextProps {
  text: string;
  searchTerms: string | string[];
  className?: string;
  highlightClassName?: string;
  caseSensitive?: boolean;
  maxLength?: number;
  showEllipsis?: boolean;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  searchTerms,
  className = '',
  highlightClassName = 'bg-yellow-200 text-yellow-900 font-semibold px-1 rounded',
  caseSensitive = false,
  maxLength,
  showEllipsis = true
}) => {
  // Handle empty or null text
  if (!text || text.trim().length === 0) {
    return <span className={className}></span>;
  }

  // Handle empty search terms
  if (!searchTerms) {
    const displayText = maxLength && text.length > maxLength 
      ? text.substring(0, maxLength) + (showEllipsis ? '...' : '')
      : text;
    return <span className={className}>{displayText}</span>;
  }

  // Normalize search terms
  const terms = Array.isArray(searchTerms) 
    ? searchTerms.filter(term => term && term.trim().length > 0)
    : [searchTerms].filter(term => term && term.trim().length > 0);

  if (terms.length === 0) {
    const displayText = maxLength && text.length > maxLength 
      ? text.substring(0, maxLength) + (showEllipsis ? '...' : '')
      : text;
    return <span className={className}>{displayText}</span>;
  }

  // Apply length limit if specified
  let processedText = text;
  let wasTruncated = false;

  if (maxLength && text.length > maxLength) {
    // Try to find a good truncation point near search terms
    let bestTruncatePos = maxLength;
    
    for (const term of terms) {
      const termPos = caseSensitive 
        ? text.indexOf(term)
        : text.toLowerCase().indexOf(term.toLowerCase());
      
      if (termPos !== -1 && termPos < maxLength) {
        // Try to include some context after the term
        const contextEnd = Math.min(termPos + term.length + 100, text.length);
        if (contextEnd <= maxLength + 50) {
          bestTruncatePos = Math.min(maxLength, contextEnd);
        }
        break;
      }
    }
    
    // Adjust to word boundary
    while (bestTruncatePos > 0 && bestTruncatePos < text.length && text.charAt(bestTruncatePos) !== ' ') {
      bestTruncatePos--;
    }
    
    processedText = text.substring(0, bestTruncatePos);
    wasTruncated = text.length > bestTruncatePos;
  }

  // Create highlighting function
  const highlightTerms = (inputText: string): string => {
    let highlightedText = inputText;
    
    // Sort terms by length (longest first) to avoid partial replacements
    const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
    
    for (const term of sortedTerms) {
      if (term.trim().length < 2) continue; // Skip very short terms
      
      // Escape special regex characters
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create regex for word boundaries
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(`\\b${escapedTerm}\\b`, flags);
      
      // Replace with highlighted version
      highlightedText = highlightedText.replace(regex, (match) => {
        return `<mark class="search-highlight">${match}</mark>`;
      });
    }
    
    return highlightedText;
  };

  // Apply highlighting
  const highlightedHTML = highlightTerms(processedText);
  
  // Add ellipsis if text was truncated
  const finalHTML = wasTruncated && showEllipsis
    ? highlightedHTML + '...'
    : highlightedHTML;

  // Sanitize HTML to prevent XSS attacks
  const sanitizedHTML = DOMPurify.sanitize(finalHTML, {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false
  });

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      style={{
        // Define CSS custom properties for the highlight styling
        '--highlight-bg': 'var(--ion-color-warning-tint, #fbbf24)',
        '--highlight-color': 'var(--ion-color-warning-contrast, #92400e)',
      } as React.CSSProperties}
    />
  );
};

// CSS styles for the component (to be added to a global CSS file or styled component)
export const highlightedTextStyles = `
  .search-highlight {
    background-color: var(--highlight-bg, #fef3c7);
    color: var(--highlight-color, #92400e);
    font-weight: 600;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .search-highlight {
      background-color: var(--highlight-bg-dark, #451a03);
      color: var(--highlight-color-dark, #fbbf24);
    }
  }
  
  /* Ionic dark mode support */
  .ios.dark .search-highlight,
  .md.dark .search-highlight {
    background-color: var(--highlight-bg-dark, #451a03);
    color: var(--highlight-color-dark, #fbbf24);
  }
`;

export default HighlightedText;