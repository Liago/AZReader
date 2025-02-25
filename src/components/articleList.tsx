import { useEffect, useState, useCallback, useRef } from "react";
import { IonList, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, RefresherEventDetail } from "@ionic/react";
import { Session } from "@supabase/auth-js";
import { Clock } from "lucide-react";
import { useHistory } from "react-router-dom";
import MessageListItem from "./messageListItem";
import LoadingSpinner from "./ui/loadingSpinner";
import useArticles from "@hooks/useArticles";
import { useCustomToast } from "@hooks/useIonToast";
import { deletePost } from "@store/rest";
import { isEmpty } from "lodash";
import { Post, Pagination, ArticleParsed } from "@common/interfaces";

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
}

const TopPickCard: React.FC<TopPickCardProps> = ({ post, onOpenArticle }) => {
	return (
		<div
			className="flex-shrink-0 w-72 h-96 rounded-xl overflow-hidden shadow-lg bg-white m-2 snap-start cursor-pointer"
			onClick={() => onOpenArticle(post)}
		>
			<div className="h-1/2 bg-gray-200 relative">
				{post.lead_image_url && <img src={post.lead_image_url} alt={post.title} className="w-full h-full object-cover" />}
			</div>
			<div className="p-4">
				<div className="text-sm text-gray-600 mb-2">{post.domain}</div>
				<h3 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h3>
				<p className="text-gray-600 text-sm line-clamp-3">{post.excerpt}</p>
			</div>
		</div>
	);
};

const TodaysGoal: React.FC = () => {
	return (
		<div className="bg-white rounded-xl p-4 shadow-lg flex items-center space-x-4 mb-6">
			<div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
				<Clock className="w-6 h-6 text-gray-600" />
			</div>
			<div>
				<div className="text-gray-600">Today's Goal</div>
				<div className="text-xl font-semibold">Read 5 minutes</div>
			</div>
		</div>
	);
};

const ArticleList: React.FC<ArticleListProps> = ({ session }) => {
	const { postFromDb, fetchPostsFromDb, changePage, pagination, isLoading, refresh } = useArticles(session) as UseArticlesReturn;
	const [todaysPosts, setTodaysPosts] = useState<Post[]>([]);
	const [isInfiniteDisabled, setInfiniteDisabled] = useState<boolean>(false);
	const showToast = useCustomToast();
	const history = useHistory();

	useEffect(() => {
		fetchPostsFromDb(true);
	}, []);

	useEffect(() => {
		if (postFromDb.length > 0) {
			const today = new Date().toISOString().split("T")[0];
			const todaysPosts = postFromDb.filter((post) => post.savedOn?.split("T")[0] === today);
			setTodaysPosts(todaysPosts);
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
			<div className="px-4 mb-8 pt-32">
				<TodaysGoal />
				<h2 className="text-2xl font-bold mb-4">Today's pick</h2>
				<div className="flex overflow-x-auto snap-x snap-mandatory pb-4 px-4">
					{todaysPosts.map((post, index) => (
						<TopPickCard key={`top-${post.id}-${index}`} post={post} onOpenArticle={handleOpenArticle} />
					))}
				</div>
			</div>
		);
	};

	const renderPostList = useCallback(() => {
		if (isEmpty(postFromDb)) return null;

		return postFromDb.map((post: Post, index: number) => (
			<MessageListItem
				key={`${post.id}-${index}`}
				postId={post.id}
				post={post}
				isLocal={false}
				deletePost={() => handleDeletePost(post.id)}
				onOpenArticle={handleOpenArticle}
			/>
		));
	}, [postFromDb, handleDeletePost, handleOpenArticle]);

	return (
		<>
			<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
				<IonRefresherContent></IonRefresherContent>
			</IonRefresher>

			<div className="relative">
				{renderTopPicks()}
				<div className="px-4">
					<h2 className="text-2xl font-bold mb-4">Staff Pick</h2>
					<IonList>{renderPostList()}</IonList>
				</div>
				{isLoading && <LoadingSpinner />}
			</div>

			<IonInfiniteScroll onIonInfinite={loadMore} threshold="100px" disabled={isInfiniteDisabled}>
				<IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Caricamento altri articoli..." />
			</IonInfiniteScroll>
		</>
	);
};

export default ArticleList;
