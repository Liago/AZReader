import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store-rtk';
import { Article, ArticleInsert, ArticleUpdate } from '@common/database-types';
import { supabase } from '@common/supabase';

// Types - Use the database Article type as the base
export interface Post extends Article {
	read_progress?: number; // Additional client-side field for reading progress
	notes?: string; // Additional client-side field for user notes
	is_archived?: boolean; // Additional client-side field
	share_count?: number; // Additional client-side field
}

export interface PostsState {
	// Posts data
	items: Post[];
	currentPost: Post | null;
	favourites: Post[];
	
	// Pagination
	pagination: {
		currentPage: number;
		itemsPerPage: number;
		totalItems: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
	
	// Filters and search
	filters: {
		tags: string[];
		dateRange: {
			start: string | null;
			end: string | null;
		};
		readStatus: 'all' | 'read' | 'unread';
		favouritesOnly: boolean;
		searchQuery: string;
		sortBy: 'created_at' | 'updated_at' | 'title' | 'estimated_read_time';
		sortOrder: 'asc' | 'desc';
	};
	
	// Loading states
	loading: {
		fetchPosts: boolean;
		createPost: boolean;
		updatePost: boolean;
		deletePost: boolean;
		searchPosts: boolean;
	};
	
	// Error handling
	errors: {
		fetch: string | null;
		create: string | null;
		update: string | null;
		delete: string | null;
		search: string | null;
	};
}

// Initial state
const initialState: PostsState = {
	items: [],
	currentPost: null,
	favourites: [],
	
	pagination: {
		currentPage: 1,
		itemsPerPage: 20,
		totalItems: 0,
		hasNextPage: false,
		hasPreviousPage: false,
	},
	
	filters: {
		tags: [],
		dateRange: {
			start: null,
			end: null,
		},
		readStatus: 'all',
		favouritesOnly: false,
		searchQuery: '',
		sortBy: 'created_at',
		sortOrder: 'desc',
	},
	
	loading: {
		fetchPosts: false,
		createPost: false,
		updatePost: false,
		deletePost: false,
		searchPosts: false,
	},
	
	errors: {
		fetch: null,
		create: null,
		update: null,
		delete: null,
		search: null,
	},
};

// Async thunks for API operations
export const fetchPosts = createAsyncThunk(
	'posts/fetchPosts',
	async (params: {
		page?: number;
		limit?: number;
		userId?: string;
		tags?: string[];
		searchQuery?: string;
	} = {}) => {
		const { page = 1, limit = 20, userId, tags, searchQuery } = params;
		
		let query = supabase
			.from('articles')
			.select('*')
			.order('created_at', { ascending: false })
			.range((page - 1) * limit, page * limit - 1);

		if (userId) {
			query = query.eq('user_id', userId);
		}

		if (tags && tags.length > 0) {
			query = query.contains('tags', tags);
		}

		if (searchQuery) {
			query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
		}

		const { data, error, count } = await query;

		if (error) throw error;

		return {
			posts: data || [],
			totalItems: count || 0,
			page,
			limit,
		};
	}
);

export const createPost = createAsyncThunk(
	'posts/createPost',
	async (postData: ArticleInsert) => {
		const { data, error } = await supabase
			.from('articles')
			.insert([{
				...postData,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}])
			.select()
			.single();

		if (error) throw error;
		return data as Post;
	}
);

export const updatePost = createAsyncThunk(
	'posts/updatePost',
	async ({ id, updates }: { id: string; updates: ArticleUpdate }) => {
		const { data, error } = await supabase
			.from('articles')
			.update({
				...updates,
				updated_at: new Date().toISOString(),
			})
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data as Post;
	}
);

export const deletePost = createAsyncThunk(
	'posts/deletePost',
	async (postId: string) => {
		const { error } = await supabase
			.from('articles')
			.delete()
			.eq('id', postId);

		if (error) throw error;
		return postId;
	}
);

export const toggleFavourite = createAsyncThunk(
	'posts/toggleFavourite',
	async ({ postId, isFavourite }: { postId: string; isFavourite: boolean }) => {
		const { data, error } = await supabase
			.from('articles')
			.update({ is_favorite: isFavourite })
			.eq('id', postId)
			.select()
			.single();

		if (error) throw error;
		return data as Post;
	}
);

export const searchPosts = createAsyncThunk(
	'posts/searchPosts',
	async (query: string) => {
		if (!query.trim()) return [];

		const { data, error } = await supabase
			.from('articles')
			.select('*')
			.or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
			.order('created_at', { ascending: false })
			.limit(50);

		if (error) throw error;
		return (data || []) as Post[];
	}
);

// Create the slice
const postsSlice = createSlice({
	name: 'posts',
	initialState,
	reducers: {
		// Synchronous actions
		setCurrentPost: (state, action: PayloadAction<Post | null>) => {
			state.currentPost = action.payload;
		},
		
		clearCurrentPost: (state) => {
			state.currentPost = null;
		},
		
		updateFilters: (state, action: PayloadAction<Partial<PostsState['filters']>>) => {
			state.filters = { ...state.filters, ...action.payload };
		},
		
		clearFilters: (state) => {
			state.filters = initialState.filters;
		},
		
		updatePagination: (state, action: PayloadAction<Partial<PostsState['pagination']>>) => {
			state.pagination = { ...state.pagination, ...action.payload };
		},
		
		addLocalPost: (state, action: PayloadAction<Post>) => {
			// Add post optimistically before API confirmation
			const post = action.payload;
			if (post.id) {
				state.items.unshift(post);
			}
		},
		
		removeLocalPost: (state, action: PayloadAction<string>) => {
			state.items = state.items.filter(post => post.id !== action.payload);
		},
		
		updateLocalPost: (state, action: PayloadAction<{ id: string; updates: Partial<Post> }>) => {
			const { id, updates } = action.payload;
			const postIndex = state.items.findIndex(post => post.id === id);
			if (postIndex !== -1) {
				const existingPost = state.items[postIndex];
				if (existingPost) {
					state.items[postIndex] = { ...existingPost, ...updates };
				}
			}
		},
		
		clearErrors: (state) => {
			state.errors = initialState.errors;
		},
		
		// Reading progress
		updateReadingProgress: (state, action: PayloadAction<{ postId: string; progress: number }>) => {
			const { postId, progress } = action.payload;
			const post = state.items.find(p => p.id === postId);
			if (post) {
				post.read_progress = Math.max(0, Math.min(100, progress));
			}
			if (state.currentPost?.id === postId) {
				state.currentPost.read_progress = progress;
			}
		},
	},
	
	extraReducers: (builder) => {
		// Fetch posts
		builder
			.addCase(fetchPosts.pending, (state) => {
				state.loading.fetchPosts = true;
				state.errors.fetch = null;
			})
			.addCase(fetchPosts.fulfilled, (state, action) => {
				state.loading.fetchPosts = false;
				const { posts, totalItems, page, limit } = action.payload;
				
				if (page === 1) {
					state.items = posts;
				} else {
					// Append for pagination
					state.items = [...state.items, ...posts];
				}
				
				state.pagination = {
					...state.pagination,
					currentPage: page,
					totalItems,
					hasNextPage: posts.length === limit,
					hasPreviousPage: page > 1,
				};
			})
			.addCase(fetchPosts.rejected, (state, action) => {
				state.loading.fetchPosts = false;
				state.errors.fetch = action.error.message || 'Failed to fetch posts';
			})
			
		// Create post
		builder
			.addCase(createPost.pending, (state) => {
				state.loading.createPost = true;
				state.errors.create = null;
			})
			.addCase(createPost.fulfilled, (state, action) => {
				state.loading.createPost = false;
				state.items.unshift(action.payload);
			})
			.addCase(createPost.rejected, (state, action) => {
				state.loading.createPost = false;
				state.errors.create = action.error.message || 'Failed to create post';
			})
			
		// Update post
		builder
			.addCase(updatePost.pending, (state) => {
				state.loading.updatePost = true;
				state.errors.update = null;
			})
			.addCase(updatePost.fulfilled, (state, action) => {
				state.loading.updatePost = false;
				const updatedPost = action.payload;
				const index = state.items.findIndex(post => post.id === updatedPost.id);
				if (index !== -1) {
					state.items[index] = updatedPost;
				}
				if (state.currentPost?.id === updatedPost.id) {
					state.currentPost = updatedPost;
				}
			})
			.addCase(updatePost.rejected, (state, action) => {
				state.loading.updatePost = false;
				state.errors.update = action.error.message || 'Failed to update post';
			})
			
		// Delete post
		builder
			.addCase(deletePost.pending, (state) => {
				state.loading.deletePost = true;
				state.errors.delete = null;
			})
			.addCase(deletePost.fulfilled, (state, action) => {
				state.loading.deletePost = false;
				const deletedId = action.payload;
				state.items = state.items.filter(post => post.id !== deletedId);
				if (state.currentPost?.id === deletedId) {
					state.currentPost = null;
				}
			})
			.addCase(deletePost.rejected, (state, action) => {
				state.loading.deletePost = false;
				state.errors.delete = action.error.message || 'Failed to delete post';
			})
			
		// Toggle favourite
		builder
			.addCase(toggleFavourite.fulfilled, (state, action) => {
				const updatedPost = action.payload;
				const index = state.items.findIndex(post => post.id === updatedPost.id);
				if (index !== -1) {
					state.items[index] = updatedPost;
				}
				
				// Update favourites list
				if (updatedPost.is_favorite) {
					if (!state.favourites.find(p => p.id === updatedPost.id)) {
						state.favourites.push(updatedPost);
					}
				} else {
					state.favourites = state.favourites.filter(p => p.id !== updatedPost.id);
				}
			})
			
		// Search posts
		builder
			.addCase(searchPosts.pending, (state) => {
				state.loading.searchPosts = true;
				state.errors.search = null;
			})
			.addCase(searchPosts.fulfilled, (state, action) => {
				state.loading.searchPosts = false;
				// Store search results separately or replace items based on UI needs
			})
			.addCase(searchPosts.rejected, (state, action) => {
				state.loading.searchPosts = false;
				state.errors.search = action.error.message || 'Search failed';
			});
	},
});

// Export actions
export const {
	setCurrentPost,
	clearCurrentPost,
	updateFilters,
	clearFilters,
	updatePagination,
	addLocalPost,
	removeLocalPost,
	updateLocalPost,
	clearErrors,
	updateReadingProgress,
} = postsSlice.actions;

// Selectors
export const selectPosts = (state: RootState) => state.posts.items;
export const selectCurrentPost = (state: RootState) => state.posts.currentPost;
export const selectFavourites = (state: RootState) => state.posts.favourites;
export const selectPostsLoading = (state: RootState) => state.posts.loading;
export const selectPostsErrors = (state: RootState) => state.posts.errors;
export const selectPostsPagination = (state: RootState) => state.posts.pagination;
export const selectPostsFilters = (state: RootState) => state.posts.filters;

// Memoized selectors
export const selectFilteredPosts = createSelector(
	[selectPosts, selectPostsFilters],
	(posts, filters) => {
		let filtered = posts;

		// Apply search query
		if (filters.searchQuery) {
			const query = filters.searchQuery.toLowerCase();
			filtered = filtered.filter(post => 
				post.title.toLowerCase().includes(query) ||
				(post.content && post.content.toLowerCase().includes(query)) ||
				(post.excerpt && post.excerpt.toLowerCase().includes(query))
			);
		}

		// Apply tag filter
		if (filters.tags.length > 0) {
			filtered = filtered.filter(post => 
				post.tags?.some(tag => filters.tags.includes(tag))
			);
		}

		// Apply read status filter
		if (filters.readStatus !== 'all') {
			filtered = filtered.filter(post => {
				const isRead = (post.read_progress || 0) >= 95;
				return filters.readStatus === 'read' ? isRead : !isRead;
			});
		}

		// Apply favourites filter
		if (filters.favouritesOnly) {
			filtered = filtered.filter(post => post.is_favorite);
		}

		// Apply date range filter
		if (filters.dateRange.start || filters.dateRange.end) {
			filtered = filtered.filter(post => {
				const postDate = new Date(post.created_at || '');
				if (filters.dateRange.start && postDate < new Date(filters.dateRange.start)) {
					return false;
				}
				if (filters.dateRange.end && postDate > new Date(filters.dateRange.end)) {
					return false;
				}
				return true;
			});
		}

		// Apply sorting
		filtered.sort((a, b) => {
			let aVal: any, bVal: any;
			
			switch (filters.sortBy) {
				case 'created_at':
					aVal = a.created_at || '';
					bVal = b.created_at || '';
					break;
				case 'updated_at':
					aVal = a.updated_at || '';
					bVal = b.updated_at || '';
					break;
				case 'title':
					aVal = a.title || '';
					bVal = b.title || '';
					break;
				case 'estimated_read_time':
					aVal = a.estimated_read_time || 0;
					bVal = b.estimated_read_time || 0;
					break;
				default:
					return 0;
			}
			
			const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
			
			if (aVal < bVal) return -1 * multiplier;
			if (aVal > bVal) return 1 * multiplier;
			return 0;
		});

		return filtered;
	}
);

export const selectPostById = createSelector(
	[selectPosts, (state: RootState, postId: string) => postId],
	(posts, postId) => posts.find(post => post.id === postId) || null
);

export const selectPostsByTag = createSelector(
	[selectPosts, (state: RootState, tag: string) => tag],
	(posts, tag) => posts.filter(post => post.tags?.includes(tag) || false)
);

export default postsSlice;