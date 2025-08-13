import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonText,
  IonButton,
  IonIcon,
  IonChip,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonItem,
  IonList,
  RefresherEventDetail,
} from '@ionic/react';
import {
  trendingUp,
  flame,
  time,
  funnel,
  refresh,
  rocket,
  library,
  people,
  analytics,
  star,
  bookmark,
  filter,
} from 'ionicons/icons';
import TrendingCard, { TrendingCardSkeleton } from '@components/TrendingCard';
import ArticleCard, { ArticleCardSkeleton } from '@components/ArticleCard';
import useDiscoverTab, { DiscoverFilters } from '@hooks/useDiscoverTab';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import type { Post } from '@store/slices/postsSlice';

export interface DiscoverTabProps {
  className?: string;
  onArticleClick?: (article: Post) => void;
}

interface DiscoverStatsCardProps {
  stats: any;
  isLoading: boolean;
}

interface FilterBarProps {
  filters: DiscoverFilters;
  categories: string[];
  onFiltersChange: (filters: Partial<DiscoverFilters>) => void;
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Stats card component
const DiscoverStatsCard: React.FC<DiscoverStatsCardProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <IonCard className="stats-card">
        <IonCardContent>
          <div className="stats-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-item">
                <div className="stat-icon loading"></div>
                <div className="stat-text">
                  <div className="stat-number loading"></div>
                  <div className="stat-label loading"></div>
                </div>
              </div>
            ))}
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  if (!stats) return null;

  return (
    <IonCard className="stats-card">
      <IonCardContent>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">
              <IonIcon icon={library} />
            </div>
            <div className="stat-text">
              <div className="stat-number">{stats.totalArticles.toLocaleString()}</div>
              <div className="stat-label">Articles</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <IonIcon icon={people} />
            </div>
            <div className="stat-text">
              <div className="stat-number">{stats.activeUsers.toLocaleString()}</div>
              <div className="stat-label">Writers</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <IonIcon icon={analytics} />
            </div>
            <div className="stat-text">
              <div className="stat-number">{stats.categoriesCount}</div>
              <div className="stat-label">Topics</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <IonIcon icon={flame} />
            </div>
            <div className="stat-text">
              <div className="stat-number">{stats.todayArticles}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// Filter bar component
const FilterBar: React.FC<FilterBarProps> = ({ filters, categories, onFiltersChange }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="filter-bar">
      <div className="primary-filters">
        <IonSegment 
          value={filters.timeWindow} 
          onIonChange={(e) => onFiltersChange({ timeWindow: e.detail.value as any })}
        >
          <IonSegmentButton value="day">
            <IonLabel>Today</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="week">
            <IonLabel>Week</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="month">
            <IonLabel>Month</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <IonButton 
          fill="clear" 
          size="small"
          onClick={() => setShowFilters(!showFilters)}
        >
          <IonIcon icon={filter} />
        </IonButton>
      </div>

      {showFilters && (
        <div className="secondary-filters">
          <IonItem>
            <IonLabel>Sort by</IonLabel>
            <IonSelect 
              value={filters.sortBy}
              onIonChange={(e) => onFiltersChange({ sortBy: e.detail.value })}
              interface="popover"
            >
              <IonSelectOption value="trending">Trending</IonSelectOption>
              <IonSelectOption value="popular">Most Popular</IonSelectOption>
              <IonSelectOption value="recent">Most Recent</IonSelectOption>
              <IonSelectOption value="top_rated">Top Rated</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel>Category</IonLabel>
            <IonSelect 
              value={filters.category || 'all'}
              onIonChange={(e) => onFiltersChange({ 
                category: e.detail.value === 'all' ? undefined : e.detail.value 
              })}
              interface="popover"
            >
              <IonSelectOption value="all">All Categories</IonSelectOption>
              {categories.map(category => (
                <IonSelectOption key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </div>
      )}
    </div>
  );
};

// Section header component
const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  icon, 
  onRefresh, 
  isLoading 
}) => (
  <div className="section-header">
    <div className="section-title">
      {icon && <IonIcon icon={icon} className="section-icon" />}
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
    </div>
    {onRefresh && (
      <IonButton 
        fill="clear" 
        size="small"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <IonIcon icon={refresh} className={isLoading ? 'spinning' : ''} />
      </IonButton>
    )}
  </div>
);

// Main DiscoverTab component
const DiscoverTab: React.FC<DiscoverTabProps> = ({ 
  className = '', 
  onArticleClick 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'all' | 'trending' | 'popular' | 'recent'>('all');

  const userState = useSelector((state: RootState) => state.user);
  // Note: ArticleCard expects Session but we have Credentials - need to convert or handle separately
  const session = null; // For now, disable session-dependent features

  const {
    trendingSection,
    popularSection,
    recentSection,
    categorizedSections,
    filters,
    isLoading,
    error,
    stats,
    updateFilters,
    loadMoreArticles,
    refreshSection,
    refreshAll,
    availableCategories,
  } = useDiscoverTab({
    initialFilters: { timeWindow: 'week', sortBy: 'trending' },
    articlesPerPage: 20,
    enableRealtime: true,
    enableCache: true,
  });

  // Handlers
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshAll();
    event.detail.complete();
  };

  const handleInfiniteScroll = async (ev: CustomEvent<void>) => {
    if (activeSection !== 'all') {
      await loadMoreArticles(activeSection);
    }
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  const handleArticleClick = (article: Post) => {
    if (onArticleClick) {
      onArticleClick(article);
    }
  };

  // Filter articles by search query
  const filterArticlesBySearch = (articles: Post[]) => {
    if (!searchQuery) return articles;
    
    const query = searchQuery.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query) ||
      article.author?.toLowerCase().includes(query) ||
      article.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  };

  // Get current section articles
  const getCurrentSectionArticles = () => {
    switch (activeSection) {
      case 'trending':
        return filterArticlesBySearch(trendingSection.articles);
      case 'popular':
        return filterArticlesBySearch(popularSection.articles);
      case 'recent':
        return filterArticlesBySearch(recentSection.articles);
      default:
        return [];
    }
  };

  // Get current section loading state
  const getCurrentSectionLoading = () => {
    switch (activeSection) {
      case 'trending':
        return trendingSection.isLoading;
      case 'popular':
        return popularSection.isLoading;
      case 'recent':
        return recentSection.isLoading;
      default:
        return false;
    }
  };

  // Get current section has more
  const getCurrentSectionHasMore = () => {
    switch (activeSection) {
      case 'trending':
        return trendingSection.hasMore;
      case 'popular':
        return popularSection.hasMore;
      case 'recent':
        return recentSection.hasMore;
      default:
        return false;
    }
  };

  // Render section content
  const renderSectionContent = () => {
    if (activeSection === 'all') {
      return (
        <div className="all-sections">
          {/* Stats */}
          <DiscoverStatsCard stats={stats} isLoading={isLoading} />

          {/* Trending Section */}
          <div className="discover-section">
            <SectionHeader
              title="🔥 Trending Now"
              subtitle="Hot articles everyone's talking about"
              icon={trendingUp}
              onRefresh={() => refreshSection('trending')}
              isLoading={trendingSection.isLoading}
            />
            
            <div className="trending-grid">
              {trendingSection.isLoading && trendingSection.articles.length === 0 ? (
                [...Array(3)].map((_, i) => (
                  <TrendingCardSkeleton key={i} variant={i === 0 ? 'featured' : 'default'} />
                ))
              ) : (
                filterArticlesBySearch(trendingSection.articles.slice(0, 6)).map((article, index) => (
                  <TrendingCard
                    key={article.id}
                    article={article}
                    rank={index + 1}
                    variant={index === 0 ? 'featured' : index <= 2 ? 'default' : 'compact'}
                    showRank={true}
                    showTrendingBadge={true}
                    showAuthor={true}
                    showEngagement={true}
                  />
                ))
              )}
            </div>

            {trendingSection.articles.length > 6 && (
              <div className="section-footer">
                <IonButton 
                  fill="outline" 
                  onClick={() => setActiveSection('trending')}
                >
                  View All Trending
                </IonButton>
              </div>
            )}
          </div>

          {/* Popular Section */}
          <div className="discover-section">
            <SectionHeader
              title="⭐ Popular This Week"
              subtitle="Most liked and commented articles"
              icon={star}
              onRefresh={() => refreshSection('popular')}
              isLoading={popularSection.isLoading}
            />
            
            <div className="articles-grid">
              {popularSection.isLoading && popularSection.articles.length === 0 ? (
                [...Array(4)].map((_, i) => (
                  <ArticleCardSkeleton key={i} variant="compact" />
                ))
              ) : (
                filterArticlesBySearch(popularSection.articles.slice(0, 4)).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    session={session}
                    variant="compact"
                    showActions={false}
                  />
                ))
              )}
            </div>

            {popularSection.articles.length > 4 && (
              <div className="section-footer">
                <IonButton 
                  fill="outline" 
                  onClick={() => setActiveSection('popular')}
                >
                  View All Popular
                </IonButton>
              </div>
            )}
          </div>

          {/* Categories Section */}
          {categorizedSections.length > 0 && (
            <div className="discover-section">
              <SectionHeader
                title="📚 Browse by Category"
                subtitle="Explore articles by topic"
                icon={library}
              />
              
              <div className="categories-grid">
                {categorizedSections.map((section) => (
                  <IonCard key={section.id} className="category-card" button>
                    <IonCardHeader>
                      <IonCardTitle>{section.title}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="category-articles">
                        {section.articles.slice(0, 3).map((article) => (
                          <div key={article.id} className="category-article">
                            <h4>{article.title.substring(0, 60)}...</h4>
                            <p>{article.like_count || 0} likes</p>
                          </div>
                        ))}
                      </div>
                      <IonChip color="primary" outline>
                        {section.articles.length} articles
                      </IonChip>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            </div>
          )}

          {/* Recent Section */}
          <div className="discover-section">
            <SectionHeader
              title="🕒 Recently Added"
              subtitle="Fresh content from our community"
              icon={time}
              onRefresh={() => refreshSection('recent')}
              isLoading={recentSection.isLoading}
            />
            
            <div className="articles-list">
              {recentSection.isLoading && recentSection.articles.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <ArticleCardSkeleton key={i} variant="compact" />
                ))
              ) : (
                filterArticlesBySearch(recentSection.articles.slice(0, 5)).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    session={session}
                    variant="compact"
                    showActions={false}
                  />
                ))
              )}
            </div>

            {recentSection.articles.length > 5 && (
              <div className="section-footer">
                <IonButton 
                  fill="outline" 
                  onClick={() => setActiveSection('recent')}
                >
                  View All Recent
                </IonButton>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Single section view
    const currentArticles = getCurrentSectionArticles();
    const isCurrentLoading = getCurrentSectionLoading();

    return (
      <div className="single-section">
        <div className="articles-list">
          {isCurrentLoading && currentArticles.length === 0 ? (
            [...Array(10)].map((_, i) => (
              <TrendingCardSkeleton 
                key={i} 
                variant={activeSection === 'trending' ? 'default' : 'compact'} 
              />
            ))
          ) : (
            currentArticles.map((article, index) => (
              activeSection === 'trending' ? (
                <TrendingCard
                  key={article.id}
                  article={article}
                  rank={index + 1}
                  variant="default"
                  showRank={true}
                  showTrendingBadge={true}
                  showAuthor={true}
                  showEngagement={true}
                />
              ) : (
                <ArticleCard
                  key={article.id}
                  article={article}
                  session={session}
                  variant="default"
                  showActions={false}
                />
              )
            ))
          )}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <IonPage className={`discover-tab ${className}`}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Discover</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="error-state">
            <IonText color="danger">
              <h2>Unable to load discover content</h2>
              <p>{error}</p>
            </IonText>
            <IonButton onClick={refreshAll}>
              <IonIcon icon={refresh} slot="start" />
              Try Again
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className={`discover-tab ${className}`}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Discover</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={refreshAll} disabled={isLoading}>
              <IonIcon icon={refresh} className={isLoading ? 'spinning' : ''} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Search and Filters */}
        <div className="discover-header">
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
            placeholder="Search articles, authors, topics..."
            showClearButton="focus"
          />
          
          <FilterBar
            filters={filters}
            categories={availableCategories}
            onFiltersChange={updateFilters}
          />
        </div>

        {/* Section Navigation */}
        <div className="section-navigation">
          <IonSegment 
            value={activeSection} 
            onIonChange={(e) => setActiveSection(e.detail.value as any)}
          >
            <IonSegmentButton value="all">
              <IonLabel>All</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="trending">
              <IonIcon icon={trendingUp} />
              <IonLabel>Trending</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="popular">
              <IonIcon icon={star} />
              <IonLabel>Popular</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="recent">
              <IonIcon icon={time} />
              <IonLabel>Recent</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Content */}
        <div className="discover-content">
          {renderSectionContent()}
        </div>

        {/* Infinite Scroll */}
        {activeSection !== 'all' && (
          <IonInfiniteScroll
            onIonInfinite={handleInfiniteScroll}
            threshold="100px"
            disabled={!getCurrentSectionHasMore()}
          >
            <IonInfiniteScrollContent
              loadingSpinner="bubbles"
              loadingText="Loading more articles..."
            />
          </IonInfiniteScroll>
        )}
      </IonContent>

      <style>{`
        .discover-tab {
          --background: var(--ion-color-light);
        }

        .discover-header {
          padding: 16px;
          background: white;
          border-bottom: 1px solid var(--ion-color-light);
        }

        .filter-bar {
          margin-top: 12px;
        }

        .primary-filters {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .primary-filters ion-segment {
          flex: 1;
        }

        .secondary-filters {
          margin-top: 12px;
          padding: 12px;
          background: var(--ion-color-light);
          border-radius: 12px;
        }

        .section-navigation {
          padding: 8px 16px;
          background: white;
          border-bottom: 1px solid var(--ion-color-light);
        }

        .discover-content {
          padding: 16px;
        }

        .all-sections {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .discover-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: var(--ion-color-dark);
        }

        .section-subtitle {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: var(--ion-color-medium);
        }

        .section-icon {
          font-size: 24px;
          color: var(--ion-color-primary);
        }

        .section-footer {
          text-align: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--ion-color-light);
        }

        .stats-card {
          margin: 0 0 16px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--ion-color-light);
          border-radius: 12px;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--ion-color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .stat-icon.loading {
          background: var(--ion-color-medium);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .stat-text {
          flex: 1;
        }

        .stat-number {
          font-size: 20px;
          font-weight: 700;
          color: var(--ion-color-dark);
          margin-bottom: 4px;
        }

        .stat-number.loading {
          height: 20px;
          background: var(--ion-color-medium);
          border-radius: 4px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .stat-label {
          font-size: 12px;
          color: var(--ion-color-medium);
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat-label.loading {
          height: 12px;
          background: var(--ion-color-medium);
          border-radius: 4px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .trending-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .articles-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .category-card {
          margin: 0;
        }

        .category-articles {
          margin-bottom: 12px;
        }

        .category-article {
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--ion-color-light);
        }

        .category-article:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .category-article h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--ion-color-dark);
        }

        .category-article p {
          margin: 0;
          font-size: 12px;
          color: var(--ion-color-medium);
        }

        .single-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          text-align: center;
          padding: 32px;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .articles-grid {
            grid-template-columns: 1fr;
          }

          .categories-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }

        @media (max-width: 576px) {
          .discover-content {
            padding: 8px;
          }

          .discover-section {
            padding: 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-item {
            padding: 12px;
          }
        }
      `}</style>
    </IonPage>
  );
};

export default DiscoverTab;