import React from 'react';
import {
	IonSegment,
	IonSegmentButton,
	IonLabel,
	IonIcon,
	IonButton,
	IonPopover,
	IonContent,
	IonList,
	IonItem,
	IonCheckbox,
	IonChip
} from '@ionic/react';
import {
	calendarOutline,
	textOutline,
	eyeOutline,
	bookmarkOutline,
	swapVerticalOutline,
	filterOutline,
	closeOutline
} from 'ionicons/icons';

// Types
export type SortField = 'date' | 'title' | 'reading_time' | 'author' | 'domain';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'default' | 'compact' | 'featured';

export interface SortOptions {
	field: SortField;
	order: SortOrder;
}

export interface FilterOptions {
	showRead: boolean;
	showUnread: boolean;
	showFavorites: boolean;
	domains: string[];
	tags: string[];
}

export interface ArticleSortControlsProps {
	sortOptions: SortOptions;
	onSortChange: (options: SortOptions) => void;
	filterOptions: FilterOptions;
	onFilterChange: (options: FilterOptions) => void;
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
	availableDomains?: string[];
	availableTags?: string[];
	totalArticles: number;
	filteredCount: number;
	className?: string;
}

// Sort field configurations
const SORT_FIELDS = [
	{ 
		key: 'date' as SortField, 
		label: 'Date', 
		icon: calendarOutline,
		description: 'Sort by publication date'
	},
	{ 
		key: 'title' as SortField, 
		label: 'Title', 
		icon: textOutline,
		description: 'Sort alphabetically by title'
	},
	{ 
		key: 'reading_time' as SortField, 
		label: 'Reading Time', 
		icon: eyeOutline,
		description: 'Sort by estimated reading time'
	},
	{ 
		key: 'author' as SortField, 
		label: 'Author', 
		icon: textOutline,
		description: 'Sort by author name'
	},
	{ 
		key: 'domain' as SortField, 
		label: 'Source', 
		icon: textOutline,
		description: 'Sort by website domain'
	}
];

const ArticleSortControls: React.FC<ArticleSortControlsProps> = ({
	sortOptions,
	onSortChange,
	filterOptions,
	onFilterChange,
	viewMode,
	onViewModeChange,
	availableDomains = [],
	availableTags = [],
	totalArticles,
	filteredCount,
	className = ''
}) => {
	const [showSortPopover, setShowSortPopover] = React.useState(false);
	const [showFilterPopover, setShowFilterPopover] = React.useState(false);
	
	// Handle sort field change
	const handleSortFieldChange = (field: SortField) => {
		// If same field, toggle order; otherwise use default order
		const newOrder: SortOrder = sortOptions.field === field 
			? (sortOptions.order === 'asc' ? 'desc' : 'asc')
			: field === 'date' ? 'desc' : 'asc'; // Default: newest first for date, A-Z for others
			
		onSortChange({ field, order: newOrder });
		setShowSortPopover(false);
	};

	// Handle filter changes
	const handleFilterToggle = (key: keyof FilterOptions, value: any) => {
		onFilterChange({
			...filterOptions,
			[key]: value
		});
	};

	// Handle domain filter
	const handleDomainToggle = (domain: string) => {
		const domains = filterOptions.domains.includes(domain)
			? filterOptions.domains.filter(d => d !== domain)
			: [...filterOptions.domains, domain];
		
		handleFilterToggle('domains', domains);
	};

	// Handle tag filter
	const handleTagToggle = (tag: string) => {
		const tags = filterOptions.tags.includes(tag)
			? filterOptions.tags.filter(t => t !== tag)
			: [...filterOptions.tags, tag];
		
		handleFilterToggle('tags', tags);
	};

	// Clear all filters
	const clearAllFilters = () => {
		onFilterChange({
			showRead: true,
			showUnread: true,
			showFavorites: false,
			domains: [],
			tags: []
		});
	};

	// Check if any filters are active
	const hasActiveFilters = !filterOptions.showRead || 
		!filterOptions.showUnread || 
		filterOptions.showFavorites ||
		filterOptions.domains.length > 0 ||
		filterOptions.tags.length > 0;

	// Get current sort field config
	const currentSortField = SORT_FIELDS.find(f => f.key === sortOptions.field) || SORT_FIELDS[0]!;

	return (
		<div className={`article-sort-controls ${className}`}>
			{/* Main Controls */}
			<div className="controls-header">
				{/* View Mode Selector */}
				<IonSegment
					value={viewMode}
					onIonChange={e => onViewModeChange(e.detail.value as ViewMode)}
					className="view-mode-segment"
				>
					<IonSegmentButton value="compact">
						<IonLabel>Compact</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="default">
						<IonLabel>Default</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="featured">
						<IonLabel>Featured</IonLabel>
					</IonSegmentButton>
				</IonSegment>

				{/* Action Buttons */}
				<div className="action-buttons">
					{/* Sort Button */}
					<IonButton 
						id="sort-trigger"
						fill="outline" 
						size="small"
						onClick={() => setShowSortPopover(true)}
					>
						<IonIcon icon={currentSortField.icon} slot="start" />
						{currentSortField.label}
						<IonIcon 
							icon={swapVerticalOutline} 
							slot="end"
							className={sortOptions.order === 'desc' ? 'rotated' : ''}
						/>
					</IonButton>

					{/* Filter Button */}
					<IonButton 
						id="filter-trigger"
						fill="outline" 
						size="small"
						color={hasActiveFilters ? 'primary' : 'medium'}
						onClick={() => setShowFilterPopover(true)}
					>
						<IonIcon icon={filterOutline} slot="start" />
						Filter
						{hasActiveFilters && (
							<IonChip color="primary" className="filter-count-chip">
								{[
									!filterOptions.showRead ? 1 : 0,
									!filterOptions.showUnread ? 1 : 0,
									filterOptions.showFavorites ? 1 : 0,
									filterOptions.domains.length,
									filterOptions.tags.length
								].reduce((sum, count) => sum + count, 0)}
							</IonChip>
						)}
					</IonButton>
				</div>
			</div>

			{/* Results Summary */}
			<div className="results-summary">
				<span className="results-text">
					{filteredCount === totalArticles 
						? `${totalArticles} articles`
						: `${filteredCount} of ${totalArticles} articles`
					}
				</span>
				
				{hasActiveFilters && (
					<IonButton 
						fill="clear" 
						size="small" 
						color="medium"
						onClick={clearAllFilters}
					>
						Clear filters
					</IonButton>
				)}
			</div>

			{/* Active Filters Display */}
			{hasActiveFilters && (
				<div className="active-filters">
					{!filterOptions.showRead && (
						<IonChip 
							color="medium" 
							outline
							onClick={() => handleFilterToggle('showRead', true)}
						>
							<IonLabel>Hide Read</IonLabel>
							<IonIcon icon={closeOutline} />
						</IonChip>
					)}
					
					{!filterOptions.showUnread && (
						<IonChip 
							color="medium" 
							outline
							onClick={() => handleFilterToggle('showUnread', true)}
						>
							<IonLabel>Hide Unread</IonLabel>
							<IonIcon icon={closeOutline} />
						</IonChip>
					)}
					
					{filterOptions.showFavorites && (
						<IonChip 
							color="warning" 
							outline
							onClick={() => handleFilterToggle('showFavorites', false)}
						>
							<IonLabel>Favorites Only</IonLabel>
							<IonIcon icon={closeOutline} />
						</IonChip>
					)}

					{filterOptions.domains.map(domain => (
						<IonChip 
							key={domain}
							color="tertiary" 
							outline
							onClick={() => handleDomainToggle(domain)}
						>
							<IonLabel>{domain}</IonLabel>
							<IonIcon icon={closeOutline} />
						</IonChip>
					))}

					{filterOptions.tags.map(tag => (
						<IonChip 
							key={tag}
							color="secondary" 
							outline
							onClick={() => handleTagToggle(tag)}
						>
							<IonLabel>{tag}</IonLabel>
							<IonIcon icon={closeOutline} />
						</IonChip>
					))}
				</div>
			)}

			{/* Sort Popover */}
			<IonPopover
				trigger="sort-trigger"
				isOpen={showSortPopover}
				onDidDismiss={() => setShowSortPopover(false)}
				showBackdrop
			>
				<IonContent>
					<IonList>
						{SORT_FIELDS.map(field => (
							<IonItem
								key={field.key}
								button
								onClick={() => handleSortFieldChange(field.key)}
								className={sortOptions.field === field.key ? 'active-sort' : ''}
							>
								<IonIcon icon={field.icon} slot="start" />
								<IonLabel>
									<h3>{field.label}</h3>
									<p>{field.description}</p>
								</IonLabel>
								{sortOptions.field === field.key && (
									<IonIcon 
										icon={swapVerticalOutline} 
										slot="end"
										className={sortOptions.order === 'desc' ? 'rotated' : ''}
									/>
								)}
							</IonItem>
						))}
					</IonList>
				</IonContent>
			</IonPopover>

			{/* Filter Popover */}
			<IonPopover
				trigger="filter-trigger"
				isOpen={showFilterPopover}
				onDidDismiss={() => setShowFilterPopover(false)}
				showBackdrop
			>
				<IonContent>
					<div className="filter-popover-content">
						{/* Reading Status Filters */}
						<div className="filter-section">
							<h4 className="filter-section-title">Reading Status</h4>
							<IonList>
								<IonItem>
									<IonCheckbox
										checked={filterOptions.showRead}
										onIonChange={e => handleFilterToggle('showRead', e.detail.checked)}
									/>
									<IonLabel className="ion-margin-start">Show Read</IonLabel>
								</IonItem>
								<IonItem>
									<IonCheckbox
										checked={filterOptions.showUnread}
										onIonChange={e => handleFilterToggle('showUnread', e.detail.checked)}
									/>
									<IonLabel className="ion-margin-start">Show Unread</IonLabel>
								</IonItem>
								<IonItem>
									<IonCheckbox
										checked={filterOptions.showFavorites}
										onIonChange={e => handleFilterToggle('showFavorites', e.detail.checked)}
									/>
									<IonLabel className="ion-margin-start">
										<IonIcon icon={bookmarkOutline} style={{marginRight: '8px'}} />
										Favorites Only
									</IonLabel>
								</IonItem>
							</IonList>
						</div>

						{/* Domain Filters */}
						{availableDomains.length > 0 && (
							<div className="filter-section">
								<h4 className="filter-section-title">Source</h4>
								<IonList>
									{availableDomains.slice(0, 10).map(domain => (
										<IonItem key={domain}>
											<IonCheckbox
												checked={filterOptions.domains.includes(domain)}
												onIonChange={() => handleDomainToggle(domain)}
											/>
											<IonLabel className="ion-margin-start">{domain}</IonLabel>
										</IonItem>
									))}
								</IonList>
							</div>
						)}

						{/* Tag Filters */}
						{availableTags.length > 0 && (
							<div className="filter-section">
								<h4 className="filter-section-title">Tags</h4>
								<div className="tag-chips">
									{availableTags.slice(0, 20).map(tag => (
										<IonChip
											key={tag}
											color={filterOptions.tags.includes(tag) ? 'primary' : 'medium'}
											outline={!filterOptions.tags.includes(tag)}
											onClick={() => handleTagToggle(tag)}
										>
											<IonLabel>{tag}</IonLabel>
										</IonChip>
									))}
								</div>
							</div>
						)}

						{/* Clear Filters */}
						{hasActiveFilters && (
							<div className="filter-section">
								<IonButton 
									expand="block" 
									fill="clear" 
									color="medium"
									onClick={() => {
										clearAllFilters();
										setShowFilterPopover(false);
									}}
								>
									Clear All Filters
								</IonButton>
							</div>
						)}
					</div>
				</IonContent>
			</IonPopover>

			<style>{`
				.article-sort-controls {
					padding: 16px;
					background: var(--ion-color-light-tint);
					border-bottom: 1px solid var(--ion-color-light-shade);
				}

				.controls-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 16px;
					gap: 16px;
				}

				.view-mode-segment {
					flex: 1;
					max-width: 300px;
				}

				.action-buttons {
					display: flex;
					gap: 8px;
				}

				.action-buttons ion-button {
					--border-radius: 20px;
					height: 36px;
				}

				.rotated {
					transform: rotate(180deg);
					transition: transform 0.3s ease;
				}

				.results-summary {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 12px;
				}

				.results-text {
					font-size: 14px;
					color: var(--ion-color-medium);
				}

				.active-filters {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					margin-top: 8px;
				}

				.active-filters ion-chip {
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.active-filters ion-chip:hover {
					opacity: 0.7;
				}

				.filter-popover-content {
					padding: 16px;
					min-width: 280px;
					max-width: 320px;
					max-height: 400px;
					overflow-y: auto;
				}

				.filter-section {
					margin-bottom: 24px;
				}

				.filter-section:last-child {
					margin-bottom: 0;
				}

				.filter-section-title {
					font-size: 16px;
					font-weight: 600;
					color: var(--ion-color-dark);
					margin: 0 0 12px 0;
				}

				.filter-section ion-list {
					margin: 0;
					padding: 0;
				}

				.filter-section ion-item {
					--padding-start: 0;
					--inner-padding-end: 0;
				}

				.tag-chips {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
				}

				.tag-chips ion-chip {
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.active-sort {
					--background: var(--ion-color-primary-tint);
				}

				.filter-count-chip {
					margin-left: 8px;
					font-size: 12px;
					height: 20px;
					min-width: 20px;
				}

				@media (max-width: 576px) {
					.controls-header {
						flex-direction: column;
						align-items: stretch;
					}

					.view-mode-segment {
						max-width: none;
					}

					.action-buttons {
						justify-content: center;
					}

					.results-summary {
						flex-direction: column;
						align-items: stretch;
						gap: 8px;
					}

					.filter-popover-content {
						min-width: 250px;
						max-width: 280px;
					}
				}
			`}</style>
		</div>
	);
};

export default ArticleSortControls;