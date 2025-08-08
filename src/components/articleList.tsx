import { useEffect, useState, useCallback, useRef } from "react";
import { IonList, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, RefresherEventDetail, IonIcon } from "@ionic/react";
import { Session } from "@supabase/auth-js";
import { Clock, Heart, MessageCircle, BookOpen } from "lucide-react";
import { bookmarkOutline, shareOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import MessageListItem from "./MessageListItem";
import LoadingSpinner from "./ui/loadingSpinner";
import useArticles from "@hooks/useArticles";
import { useCustomToast } from "@hooks/useIonToast";
import { deletePost } from "@store/rest";
import { isEmpty } from "lodash";
import { Post, Pagination, ArticleParsed } from "@common/interfaces";
import { usePostLikes } from "@hooks/usePostLikes";
import { usePostComments } from "@hooks/usePostComments";
import ReadingThemeWrapper from "./ui/ReadingThemeWrapper";

interface ArticleListProps {
	session: Session;
}

interface UseArticlesReturn {
	postFromDb: Post[];
	fetchPostsFromDb: (value: boolean) => Promise<void>;
	changePage: (page: number) => void;
	pagination: Pagination;
	isLoading: boolean;
	refresh: () => Promise<void>;
}

interface TopPickCardProps {
	post: Post;
	onOpenArticle: (post: Post) => void;
	session: Session | null;
}

const TopPickCard: React.FC<TopPickCardProps> = ({ post, onOpenArticle, session }) => {
	const { likesCount } = usePostLikes(post.id, session);
	const { commentsCount } = usePostComments(post.id, session);

	return (
		<div
			className="flex-shrink-0 w-72 h-96 rounded-xl overflow-hidden shadow-card bg-white border border-gray-50 m-2 snap-start cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-soft"
			onClick={() => onOpenArticle(post)}
		>
			<div className="h-1/2 bg-gray-100 relative">
				{post.lead_image_url && <img src={post.lead_image_url} alt={post.title} className="w-full h-full object-cover" />}

				<div className="absolute bottom-3 right-3 flex gap-2">
					<div className="bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
						<Heart size={14} className="text-black" />
						<span className="text-xs font-medium text-black">{likesCount || 0}</span>
					</div>
					<div className="bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
						<MessageCircle size={14} className="text-black" />
						<span className="text-xs font-medium text-black">{commentsCount || 0}</span>
					</div>
				</div>
			</div>
			<div className="p-5">
				<div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">{post.domain}</div>
				<h3 className="text-lg font-bold mb-3 line-clamp-2 text-black">{post.title}</h3>
				<p className="text-gray-600 text-sm line-clamp-3">{post.excerpt}</p>
			</div>
		</div>
	);
};

const TodaysGoal: React.FC = () => {
	return (
		<div className="bg-gradient-primary rounded-xl p-5 shadow-card flex items-center space-x-4 mb-6 animate-fade-in">
			<div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
				<BookOpen className="w-6 h-6 text-white" />
			</div>
			<div>
				<div className="text-white/80 text-sm">Oggi</div>
				<div className="text-xl font-semibold text-white">Leggi 5 minuti</div>
			</div>
		</div>
	);
};

const ArticleList: React.FC<ArticleListProps> = ({ session }) => {
	const { postFromDb, fetchPostsFromDb, changePage, pagination, isLoading, refresh } = useArticles(session) as UseArticlesReturn;
	const [todaysPosts, setTodaysPosts] = useState<Post[]>([]);
	const [staffPicks, setStaffPicks] = useState<Post[]>([]);
	const [isInfiniteDisabled, setInfiniteDisabled] = useState<boolean>(false);
	const showToast = useCustomToast();
	const history = useHistory();

	useEffect(() => {
		fetchPostsFromDb(true);
	}, []);

	useEffect(() => {
		if (postFromDb.length > 0) {
			const today = new Date().toISOString().split("T")[0];
			const todaysPostsArray = postFromDb.filter((post) => post.savedOn?.split("T")[0] === today);
			setTodaysPosts(todaysPostsArray);

			// Filtra gli articoli per Staff Pick (tutti quelli non presenti in Today's Pick)
			const todaysPostIds = todaysPostsArray.map(post => post.id);
			const staffPicksArray = postFromDb.filter(post => !todaysPostIds.includes(post.id));
			setStaffPicks(staffPicksArray);
		}
	}, [postFromDb]);

	useEffect(() => {
		setInfiniteDisabled(postFromDb.length >= pagination.totalItems);
	}, [postFromDb, pagination.totalItems]);

	const handleRefresh = useCallback(
		async (event: CustomEvent<RefresherEventDetail>) => {
			await refresh();
			event.detail.complete();
		},
		[refresh]
	);

	const loadMore = useCallback(
		(event: CustomEvent) => {
			const nextPage = pagination.currentPage + 1;
			changePage(nextPage);
			(event.target as HTMLIonInfiniteScrollElement).complete();
		},
		[pagination.currentPage, changePage]
	);

	const handleDeletePost = useCallback(
		async (postId: string) => {
			try {
				await deletePost(postId);
				showToast({
					message: "Articolo cancellato con successo!",
					color: "success",
				});
				refresh();
			} catch (error: any) {
				showToast({
					message: error.message || "Errore durante l'eliminazione dell'articolo",
					color: "danger",
				});
			}
		},
		[showToast, refresh]
	);

	// Gestisce la navigazione all'articolo invece di aprire una modale
	const handleOpenArticle = useCallback(
		(post: Post) => {
			// Naviga all'articolo utilizzando l'ID del post
			history.push(`/article/${post.id}`);
		},
		[history]
	);

	const renderFeaturedArticle = () => {
		if (isEmpty(postFromDb)) return null;

		// Usa il primo articolo come featured
		const featuredPost = postFromDb[0];

		return (
			<div className="px-4 py-6">
				<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
					<div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200">
						{featuredPost?.lead_image_url ? (
							<img 
								src={featuredPost?.lead_image_url} 
								alt={featuredPost?.title}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center">
									<span className="text-white text-2xl font-bold">{featuredPost?.domain?.charAt(0).toUpperCase()}</span>
								</div>
							</div>
						)}
						<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
						<div className="absolute bottom-4 left-4 right-4">
							<h2 className="text-white text-xl font-bold mb-2 line-clamp-2">{featuredPost?.title}</h2>
							<p className="text-white/80 text-sm mb-3 line-clamp-2">{featuredPost?.excerpt || `From ${featuredPost?.domain} • Saved article...`}</p>
							<button 
								className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
								onClick={() => featuredPost && handleOpenArticle(featuredPost)}
							>
								Read More
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const renderTrendingArticles = useCallback(() => {
		if (isEmpty(postFromDb)) return null;

		// Usa tutti gli articoli tranne il primo (che è featured)
		const trendingPosts = postFromDb.slice(1);

		return (
			<div className="space-y-4">
				{trendingPosts.map((post: Post, index: number) => (
					<div key={post.id} className="bg-white rounded-xl p-4 shadow-sm flex items-start space-x-3">
						{post.lead_image_url ? (
							<img 
								src={post.lead_image_url}
								alt={post.title}
								className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
							/>
						) : (
							<div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
								<span className="text-gray-500 text-xs font-bold">{post.domain?.charAt(0).toUpperCase()}</span>
							</div>
						)}
						<div className="flex-1 min-w-0" onClick={() => handleOpenArticle(post)}>
							<div className="flex items-center space-x-2 mb-1">
								<span className="text-sm font-medium text-black">{post.domain}</span>
								<span className="text-gray-400">•</span>
								<span className="text-sm text-gray-500">World</span>
							</div>
							<h4 className="text-base font-semibold text-black mb-2 line-clamp-2 cursor-pointer">{post.title}</h4>
							<div className="flex items-center space-x-4 text-sm text-gray-500">
								<span>5 min read</span>
								<div className="flex items-center space-x-2">
									<IonIcon icon={bookmarkOutline} className="w-4 h-4" />
									<IonIcon icon={shareOutline} className="w-4 h-4" />
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}, [postFromDb, handleOpenArticle]);

	return (
		<>
			<ReadingThemeWrapper>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>

				<div className="relative bg-gray-50 dark:bg-gray-900 min-h-screen">
					{isLoading && postFromDb.length === 0 ? (
						<div className="px-4 pt-6 animate-fade-in">
							<div className="bg-white rounded-2xl shadow-sm h-48 article-loading mb-6"></div>
							<div className="space-y-4">
								{[1, 2, 3, 4].map((idx) => (
									<div key={`skeleton-item-${idx}`} className="bg-white rounded-xl article-loading h-20"></div>
								))}
							</div>
						</div>
					) : (
						<>
							{renderFeaturedArticle()}
							
							{/* Trending Section */}
							<div className="px-4 pb-20">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-xl font-bold text-black dark:text-white">Trending</h3>
									<button className="text-blue-600 text-sm font-medium">See All</button>
								</div>
								{renderTrendingArticles()}
							</div>
						</>
					)}
					{isLoading && postFromDb.length > 0 && <LoadingSpinner />}
				</div>

				<IonInfiniteScroll onIonInfinite={loadMore} threshold="100px" disabled={isInfiniteDisabled}>
					<IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Caricamento altri articoli..." />
				</IonInfiniteScroll>
			</ReadingThemeWrapper>
		</>
	);
};

export default ArticleList;
