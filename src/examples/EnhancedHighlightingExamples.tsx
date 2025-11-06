// Enhanced Highlighting System Examples
// Demonstrates integration of Task 10.8 and Task 10.9

import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCheckbox,
  IonRange,
  IonBadge,
  IonChip,
} from '@ionic/react';

// Enhanced highlighting components
import EnhancedHighlightedText, {
  TitleHighlight,
  ContentHighlight,
  AuthorHighlight,
  TagHighlight,
  useEnhancedHighlighting
} from '@components/EnhancedHighlightedText';

import EnhancedSearchResultCard from '@components/EnhancedSearchResultCard';
import EnhancedSearchResultsList from '@components/EnhancedSearchResultsList';

// Utilities
import {
  highlightText,
  highlightWithFieldContext,
  parseSearchQuery,
  extractTermsFromQuery,
  HIGHLIGHT_COLORS
} from '@utils/enhancedHighlighting';

// Mock data
import { EnhancedSearchResult, EnhancedPaginatedSearchResults } from '@services/enhancedSearchService';

// Example data
const sampleArticles: EnhancedSearchResult[] = [
	{
		id: "1",
		title: "Machine Learning Fundamentals in JavaScript Applications",
		content:
			"This comprehensive guide explores how machine learning algorithms can be integrated into modern JavaScript applications using TensorFlow.js and other ML libraries...",
		url: "https://example.com/ml-js-fundamentals",
		author: "Dr. Sarah Johnson",
		domain: "techblog.example.com",
		created_at: "2024-01-15T10:00:00Z",
		user_id: "user-1",
		excerpt: "This comprehensive guide explores how machine learning algorithms can be integrated...",
		updated_at: "2024-01-15T10:00:00Z",
		is_public: true,
		image_url: null,
		favicon_url: null,
		scraped_at: "2024-01-15T10:00:00Z",
		reading_time: 10,
		published_date: "2024-01-15T10:00:00Z",
		like_count: 42,
		comment_count: 5,
		estimated_read_time: 5,
		tags: [
			{ id: "1", name: "JavaScript", color: "#f7df1e" },
			{ id: "2", name: "Machine Learning", color: "#ff6b6b" },
			{ id: "3", name: "TensorFlow", color: "#ff6f00" },
			{ id: "4", name: "AI", color: "#4ecdc4" },
		],
		relevance_score: 0.95,
		snippet:
			"JavaScript applications can now leverage powerful machine learning capabilities through browser-based libraries. This article demonstrates practical implementations...",
		matched_fields: ["title", "content", "tags"],
		search_context: {
			query_type: "phrase",
			normalized_query: "machine learning javascript",
			execution_time_ms: 42.5,
		},
		is_favorite: false,
		reading_status: "unread",
	},
	{
		id: "2",
		title: "Advanced React Patterns for Complex User Interfaces",
		content:
			"Learn advanced React patterns including render props, compound components, and custom hooks for building scalable user interfaces...",
		url: "https://example.com/advanced-react-patterns",
		author: "Michael Chen",
		domain: "reactdev.example.com",
		created_at: "2024-01-12T14:30:00Z",
		user_id: "user-2",
		excerpt: "Learn advanced React patterns including render props, compound components...",
		updated_at: "2024-01-12T14:30:00Z",
		is_public: true,
		image_url: null,
		favicon_url: null,
		scraped_at: "2024-01-12T14:30:00Z",
		reading_time: 8,
		published_date: "2024-01-15T10:00:00Z",
		like_count: 42,
		comment_count: 5,
		estimated_read_time: 5,
		tags: [
			{ id: "5", name: "React", color: "#61dafb" },
			{ id: "6", name: "JavaScript", color: "#f7df1e" },
			{ id: "7", name: "UI/UX", color: "#9c27b0" },
			{ id: "8", name: "Frontend", color: "#2196f3" },
		],
		relevance_score: 0.87,
		snippet:
			"React patterns provide powerful abstractions for component composition. This guide covers advanced techniques for professional JavaScript development...",
		matched_fields: ["title", "content", "tags"],
		search_context: {
			query_type: "simple",
			normalized_query: "react javascript patterns",
			execution_time_ms: 28.3,
		},
		is_favorite: true,
		reading_status: "reading",
	},
	{
		id: "3",
		title: "Building Scalable APIs with Node.js and Express",
		content: "A comprehensive guide to building production-ready APIs using Node.js, Express, and modern JavaScript ES6+ features...",
		url: "https://example.com/nodejs-api-guide",
		author: "Alex Rodriguez",
		domain: "backend.example.com",
		created_at: "2024-01-10T09:15:00Z",
		user_id: "user-3",
		excerpt: "A comprehensive guide to building production-ready APIs using Node.js...",
		updated_at: "2024-01-10T09:15:00Z",
		is_public: true,
		image_url: null,
		favicon_url: null,
		scraped_at: "2024-01-10T09:15:00Z",
		published_date: "2024-01-10T09:15:00Z", // Added missing published_date
		reading_time: 12,
		like_count: 28,
		comment_count: 3,
		estimated_read_time: 7,
		tags: [
			{ id: "9", name: "Node.js", color: "#339933" },
			{ id: "10", name: "Express", color: "#000000" },
			{ id: "11", name: "API", color: "#ff9800" },
			{ id: "12", name: "Backend", color: "#795548" },
		],
		relevance_score: 0.76,
		snippet:
			"Node.js provides an excellent runtime for building scalable backend applications. This tutorial covers API design patterns and best practices...",
		matched_fields: ["title", "content", "author"],
		search_context: {
			query_type: "complex",
			normalized_query: "node.js AND (api OR backend) NOT frontend",
			execution_time_ms: 65.8,
		},
		is_favorite: false,
		reading_status: "completed",
	},
];

const sampleSearchResults: EnhancedPaginatedSearchResults = {
  results: sampleArticles,
  totalCount: 3,
  hasMore: false,
  query: 'javascript',
  filters: { query: 'javascript' },
  executionTimeMs: 45.5,
  searchStats: {
    field_matches: {
      title: 3,
      content: 3,
      author: 1,
      tags: 2
    },
    query_complexity: 'simple',
    performance_score: 0.86
  }
};

const EnhancedHighlightingExamples: React.FC = () => {
  // State for interactive examples
  const [searchQuery, setSearchQuery] = useState('javascript machine learning');
  const [sampleText, setSampleText] = useState('JavaScript machine learning applications are revolutionizing how we build intelligent software.');
  const [enableMultipleColors, setEnableMultipleColors] = useState(true);
  const [enableDebugMode, setEnableDebugMode] = useState(false);
  const [showMatchedFields, setShowMatchedFields] = useState(true);
  const [showSearchContext, setShowSearchContext] = useState(true);
  const [selectedFieldType, setSelectedFieldType] = useState<'title' | 'content' | 'author' | 'tags'>('content');
  const [maxLength, setMaxLength] = useState(100);
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Example highlighting results
  const [highlightingResult, setHighlightingResult] = useState<any>(null);
  const [queryAnalysis, setQueryAnalysis] = useState<any>(null);
  const [extractedTerms, setExtractedTerms] = useState<string[]>([]);

  // Update results when settings change
  useEffect(() => {
    if (sampleText && searchQuery) {
      const result = highlightText(sampleText, searchQuery, {
        maxLength: maxLength > 0 ? maxLength : undefined,
        caseSensitive,
        enableDebug: enableDebugMode
      });
      setHighlightingResult(result);

      const analysis = parseSearchQuery(searchQuery);
      setQueryAnalysis(analysis);

      const terms = extractTermsFromQuery(searchQuery);
      setExtractedTerms(terms);
    }
  }, [sampleText, searchQuery, maxLength, caseSensitive, enableDebugMode]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Enhanced Highlighting Examples</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        {/* Basic Examples Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>1. Basic Highlighting Components</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">EnhancedHighlightedText</h4>
                <EnhancedHighlightedText
                  text="JavaScript machine learning applications are becoming increasingly popular in modern web development."
                  searchQuery="javascript machine learning"
                  enableMultipleColors={true}
                  showMatchCount={true}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Field-Specific Variants</h4>
                <div className="space-y-2">
                  <div>
                    <strong>Title:</strong>
                    <TitleHighlight 
                      text="Machine Learning Guide for JavaScript Developers" 
                      searchQuery="machine learning javascript" 
                    />
                  </div>
                  <div>
                    <strong>Content:</strong>
                    <ContentHighlight 
                      text="This comprehensive guide covers machine learning implementation in JavaScript applications using TensorFlow.js and other modern libraries." 
                      searchQuery="machine learning javascript" 
                    />
                  </div>
                  <div>
                    <strong>Author:</strong>
                    <AuthorHighlight 
                      text="Dr. Sarah Johnson" 
                      searchQuery="sarah" 
                    />
                  </div>
                  <div>
                    <strong>Tag:</strong>
                    <TagHighlight 
                      text="JavaScript" 
                      searchQuery="script" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Interactive Examples Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>2. Interactive Highlighting Playground</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-4">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IonItem>
                  <IonLabel position="stacked">Search Query</IonLabel>
                  <IonInput
                    value={searchQuery}
                    onIonInput={(e) => setSearchQuery(e.detail.value!)}
                    placeholder="Enter search terms..."
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Sample Text</IonLabel>
                  <IonInput
                    value={sampleText}
                    onIonInput={(e) => setSampleText(e.detail.value!)}
                    placeholder="Enter text to highlight..."
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>Multiple Colors</IonLabel>
                  <IonToggle
                    checked={enableMultipleColors}
                    onIonChange={(e) => setEnableMultipleColors(e.detail.checked)}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>Debug Mode</IonLabel>
                  <IonToggle
                    checked={enableDebugMode}
                    onIonChange={(e) => setEnableDebugMode(e.detail.checked)}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>Case Sensitive</IonLabel>
                  <IonToggle
                    checked={caseSensitive}
                    onIonChange={(e) => setCaseSensitive(e.detail.checked)}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>Field Type</IonLabel>
                  <IonSelect
                    value={selectedFieldType}
                    onIonChange={(e: any) => setSelectedFieldType(e.detail.value)}
                  >
                    <IonSelectOption value="title">Title</IonSelectOption>
                    <IonSelectOption value="content">Content</IonSelectOption>
                    <IonSelectOption value="author">Author</IonSelectOption>
                    <IonSelectOption value="tags">Tags</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </div>

              <IonItem>
                <IonLabel>Max Length: {maxLength}</IonLabel>
                <IonRange
                  min={0}
                  max={200}
                  value={maxLength}
                  onIonInput={(e) => setMaxLength(e.detail.value as number)}
                  pin={true}
                />
              </IonItem>

              {/* Live Preview */}
              <div className="border p-4 rounded bg-gray-50">
                <h4 className="font-medium mb-2">Live Preview</h4>
                <EnhancedHighlightedText
                  text={sampleText}
                  searchQuery={searchQuery}
                  fieldType={selectedFieldType}
                  enableMultipleColors={enableMultipleColors}
                  showPerformanceInfo={enableDebugMode}
                  options={{
                    maxLength: maxLength > 0 ? maxLength : undefined,
                    caseSensitive,
                    enableDebug: enableDebugMode
                  }}
                />
              </div>

              {/* Analysis Results */}
              {queryAnalysis && (
                <div className="space-y-2">
                  <h4 className="font-medium">Query Analysis</h4>
                  <div className="flex flex-wrap gap-2">
                    <IonChip color="primary">
                      Type: {queryAnalysis.query_type}
                    </IonChip>
                    <IonChip color="secondary">
                      Words: {queryAnalysis.word_count}
                    </IonChip>
                    {queryAnalysis.phrase_parts.length > 0 && (
                      <IonChip color="success">
                        Phrases: {queryAnalysis.phrase_parts.length}
                      </IonChip>
                    )}
                    {queryAnalysis.detected_operators.length > 0 && (
                      <IonChip color="warning">
                        Operators: {queryAnalysis.detected_operators.join(', ')}
                      </IonChip>
                    )}
                  </div>
                </div>
              )}

              {extractedTerms.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Extracted Terms</h4>
                  <div className="flex flex-wrap gap-1">
                    {extractedTerms.map((term, index) => (
                      <IonBadge key={index} color="medium">
                        {term}
                      </IonBadge>
                    ))}
                  </div>
                </div>
              )}

              {highlightingResult && enableDebugMode && (
                <div>
                  <h4 className="font-medium mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Execution Time:</strong><br/>
                      {highlightingResult.performance.executionTime.toFixed(2)}ms
                    </div>
                    <div>
                      <strong>Matches Found:</strong><br/>
                      {highlightingResult.matches.length}
                    </div>
                    <div>
                      <strong>Content Length:</strong><br/>
                      {highlightingResult.performance.contentLength} chars
                    </div>
                  </div>
                </div>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Search Result Card Examples */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>3. Enhanced Search Result Cards</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap gap-4 mb-4">
                <IonItem>
                  <IonCheckbox
                    checked={showMatchedFields}
                    onIonChange={(e) => setShowMatchedFields(e.detail.checked)}
                  />
                  <IonLabel className="ml-2">Show Matched Fields</IonLabel>
                </IonItem>
                <IonItem>
                  <IonCheckbox
                    checked={showSearchContext}
                    onIonChange={(e) => setShowSearchContext(e.detail.checked)}
                  />
                  <IonLabel className="ml-2">Show Search Context</IonLabel>
                </IonItem>
              </div>

              {/* Sample Cards */}
              {sampleArticles.map((article, index) => (
                <EnhancedSearchResultCard
                  key={article.id}
                  result={article}
                  searchQuery={searchQuery}
                  showMatchedFields={showMatchedFields}
                  showSearchContext={showSearchContext}
                  showRelevanceScore={true}
                  enableMultipleColors={enableMultipleColors}
                  enableDebugMode={enableDebugMode}
                  onOpen={(result) => {
                    console.log('Opening article:', result.title);
                  }}
                  onToggleBookmark={(result) => {
                    console.log('Toggling bookmark for:', result.title);
                  }}
                />
              ))}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Complete Search Results List */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>4. Complete Search Results List</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <EnhancedSearchResultsList
              enhancedSearchResults={sampleSearchResults}
              searchQuery={searchQuery}
              enableEnhancedHighlighting={true}
              enableMultipleColors={enableMultipleColors}
              showMatchedFields={showMatchedFields}
              showSearchContext={showSearchContext}
              enableDebugMode={enableDebugMode}
              onResultClick={(result) => {
                console.log('Result clicked:', result.title);
              }}
              onToggleBookmark={(result) => {
                console.log('Bookmark toggled:', result.title);
              }}
            />
          </IonCardContent>
        </IonCard>

        {/* Color Palette Examples */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>5. Color Palette</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Available Highlight Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(HIGHLIGHT_COLORS).map(([name, color]) => (
                    <div key={name} className="text-center">
                      <div 
                        className="w-full h-8 rounded border"
                        style={{ backgroundColor: color }}
                      />
                      <div className="text-xs mt-1 capitalize">{name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Multi-Color Example</h4>
                <EnhancedHighlightedText
                  text="This example demonstrates machine learning algorithms for JavaScript applications using React and Node.js frameworks with artificial intelligence capabilities."
                  searchQuery="machine learning javascript react node artificial intelligence"
                  enableMultipleColors={true}
                  showMatchCount={true}
                  showPerformanceInfo={true}
                />
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Advanced Query Examples */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>6. Advanced Query Types</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'Simple Query',
                  query: 'machine learning javascript',
                  description: 'Individual word matching with relevance scoring'
                },
                {
                  title: 'Phrase Query',
                  query: '"machine learning" "artificial intelligence"',
                  description: 'Exact phrase matching with quote support'
                },
                {
                  title: 'Boolean Query',
                  query: 'machine AND learning OR (javascript NOT python)',
                  description: 'Complex boolean logic with operators'
                },
                {
                  title: 'Mixed Query',
                  query: '"deep learning" AND javascript OR react',
                  description: 'Combination of phrases and boolean operators'
                }
              ].map((example, index) => (
                <div key={index} className="border p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium">{example.title}</h5>
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => setSearchQuery(example.query)}
                    >
                      Try It
                    </IonButton>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {example.description}
                  </div>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {example.query}
                  </div>
                  <div className="mt-2">
                    <EnhancedHighlightedText
                      text="JavaScript machine learning applications are revolutionizing artificial intelligence development with deep learning frameworks like TensorFlow and React-based interfaces."
                      searchQuery={example.query}
                      enableMultipleColors={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Performance Examples */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>7. Performance Monitoring</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Performance Test</h4>
                <IonButton
                  expand="block"
                  onClick={() => {
                    const startTime = performance.now();
                    const largeText = Array(1000).fill(sampleText).join(' ');
                    const result = highlightText(largeText, searchQuery, { enableDebug: true });
                    const endTime = performance.now();
                    
                    console.log('Performance Test Results:', {
                      textLength: largeText.length,
                      highlightTime: endTime - startTime,
                      matches: result.matches.length,
                      efficiency: (result.matches.length / (endTime - startTime)).toFixed(2) + ' matches/ms'
                    });
                  }}
                >
                  Run Performance Test
                </IonButton>
              </div>

              <div>
                <h4 className="font-medium mb-2">Memory Usage Monitoring</h4>
                <div className="text-sm text-gray-600">
                  Open browser dev tools console to see detailed performance metrics
                  when debug mode is enabled.
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        <style>{`
          .space-y-4 > * + * {
            margin-top: 1rem;
          }
          .space-y-2 > * + * {
            margin-top: 0.5rem;
          }
          .grid {
            display: grid;
          }
          .grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
          .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .grid-cols-5 {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
          .gap-1 {
            gap: 0.25rem;
          }
          .gap-2 {
            gap: 0.5rem;
          }
          .gap-4 {
            gap: 1rem;
          }
          .border {
            border: 1px solid #e5e7eb;
          }
          .rounded {
            border-radius: 0.375rem;
          }
          .p-2 {
            padding: 0.5rem;
          }
          .p-3 {
            padding: 0.75rem;
          }
          .p-4 {
            padding: 1rem;
          }
          .bg-gray-50 {
            background-color: #f9fafb;
          }
          .bg-gray-100 {
            background-color: #f3f4f6;
          }
          .text-gray-600 {
            color: #4b5563;
          }
          .font-mono {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }
          .font-medium {
            font-weight: 500;
          }
          @media (min-width: 768px) {
            .md\\:grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .md\\:grid-cols-5 {
              grid-template-columns: repeat(5, minmax(0, 1fr));
            }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default EnhancedHighlightingExamples;