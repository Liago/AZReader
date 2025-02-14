export interface ApiResponse<T = any> {
	data: T;
	error: any;
	loading: boolean;
}

export interface PostData {
	savedOn?: string;
	[key: string]: any;
}

export interface SaveTagsResponse {
	id: string;
	tags: string[];
}

export interface ArticleParsed {
	url?: string;
	domain?: string;
	title: string;
	content?: string;
	html?: string;
	lead_image_url?: string;
	date?: string;
	date_published?: string;
	excerpt?: string;
	topImage?: string;
	readingList?: string[];
	savedBy?: {
		userId: string;
		userEmail: string;
	};
	savedOn?: string;
	id?: string;
}

export interface ArticleProps {
	articleParsed: ArticleParsed;
	onDismiss: () => void;
	postId: string;
	displayFrom?: "modalPreview" | string;
}

export interface HeaderProps {
	onDismiss: () => void;
}

export interface TagsModalProps {
	showModal: boolean;
	dismissTagModalHandler: (tags: string[]) => void;
	postId: string;
	clickme: () => void;
}

// Interface for pagination state
export interface Pagination {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
}

// Export Interface for posts state in Redux
export interface PostsState {
	list: ArticleParsed[];
	pagination: Pagination;
}

// Root state export interface for Redux
export interface RootState {
	posts: PostsState;
}

// Export Interface for scraper parameters
export interface ScraperParams {
	parser?: "personal" | "rapidApi" | undefined;
}

// interfaces.ts
export interface ApiResponse<T = any> {
	data: T; // Rimosso il null dal tipo
	error: any | null;
	loading: boolean;
}

export type UseLazyApiReturn<T> = [
	(payload?: any) => Promise<void>,
	ApiResponse<T | null> // Qui permettiamo il null
];
export interface TagsPayload {
	id: string;
	tags: string[];
}
export type UseLazyApiFunction = (payload?: any) => Promise<void>;

export interface ArticleParseResponse {
	title: string;
	content?: string;
	html?: string;
	lead_image_url?: string;
	date?: string;
	date_published?: string;
	domain: string;
	excerpt?: string;
	topImage?: string;
}

export interface TagItem {
	id: string;
	tags: string[];
}

export interface TagsResponse extends TagItem {
	createdAt?: string;
	updatedAt?: string;
}

export interface Post {
	id: string;
	[key: string]: any; // Altri campi del post
}

export interface Session {
	user?: {
		id: string;
		[key: string]: any;
	};
	[key: string]: any;
}

export interface ArticleListProps {
	session: Session;
}

export interface Pagination {
	currentPage: number;
	totalItems: number;
}
