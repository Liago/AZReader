import { useEffect, useState, useCallback, useRef } from "react";
import { IonList, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, RefresherEventDetail } from "@ionic/react";
import { Session } from "@supabase/auth-js";
import { Clock, Heart, MessageCircle, BookOpen } from "lucide-react";
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

	const renderTopPicks = () => {
		if (isEmpty(todaysPosts)) return null;

		return (
			<div className="px-5 mb-10 pt-5 animate-slide-in">
				<TodaysGoal />
				<h2 className="text-2xl font-bold mb-5 text-black">I tuoi articoli di oggi</h2>
				<div className="flex overflow-x-auto snap-x snap-mandatory pb-5 -mx-5 px-5 scrollbar-hide">
					{todaysPosts.map((post, index) => (
						<TopPickCard
							key={`top-${post.id}-${index}`}
							post={post}
							onOpenArticle={handleOpenArticle}
							session={session}
						/>
					))}
				</div>
			</div>
		);
	};

	const renderPostList = useCallback(() => {
		if (isEmpty(staffPicks)) return null;

		return staffPicks.map((post: Post, index: number) => (
			<MessageListItem
				key={`${post.id}-${index}`}
				postId={post.id}
				post={post}
				isLocal={false}
				deletePost={() => handleDeletePost(post.id)}
				onOpenArticle={handleOpenArticle}
				showEngagementMetrics={true}
				session={session}
			/>
		));
	}, [staffPicks, handleDeletePost, handleOpenArticle, session]);

	return (
		<>
			<ReadingThemeWrapper>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>

				<div className="relative bg-gray-50 dark:bg-gray-900 min-h-screen">
					{isLoading && postFromDb.length === 0 ? (
						<div className="px-5 pt-5 animate-fade-in">
							<div className="h-8 w-40 article-loading rounded mb-5"></div>
							<div className="flex overflow-x-auto pb-5 -mx-5 px-5 space-x-4">
								{[1, 2, 3].map((idx) => (
									<div key={`skeleton-top-${idx}`} className="w-72 flex-shrink-0 rounded-xl article-loading h-44"></div>
								))}
							</div>
						</div>
					) : (
						renderTopPicks()
					)}

					<div className="px-5 pb-20" style={{
						animationDelay: '0.1s',
						animation: 'fadeIn 0.6s ease-out'
					}}>
						<div className="flex items-center justify-between mb-5">
							<h2 className="text-2xl font-bold text-black dark:text-white">Articoli consigliati</h2>
							<span className="text-xs font-medium text-primary px-3 py-1.5 bg-primary-light/10 rounded-full">
								{staffPicks.length} articoli
							</span>
						</div>
						{isLoading && postFromDb.length === 0 ? (
							<div className="space-y-4">
								{[1, 2, 3, 4].map((idx) => (
									<div key={`skeleton-item-${idx}`} className="article-loading h-24 rounded-xl"></div>
								))}
							</div>
						) : (
							<div className="space-y-4">
								{renderPostList()}
							</div>
						)}
					</div>
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
