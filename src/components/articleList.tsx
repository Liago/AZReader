import { useEffect, useState, useCallback } from "react";
import { IonList, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, RefresherEventDetail } from "@ionic/react";
import { Session } from "@supabase/auth-js";
import MessageListItem from "./messageListItem";
import LoadingSpinner from "./ui/loadingSpinner";
import useArticles from "../hooks/useArticles";
import { useCustomToast } from "../hooks/useIonToast";
import { deletePost } from "../store/rest";
import { isEmpty } from "lodash";
import { Post, Pagination } from "../common/interfaces";


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

interface MessageListItemProps {
	post: Post;
	isLocal: boolean;
	postId: string;
	deletePost: () => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ session }) => {
	const { postFromDb, fetchPostsFromDb, changePage, pagination, isLoading, refresh } = useArticles(session) as UseArticlesReturn;

	const [isInfiniteDisabled, setInfiniteDisabled] = useState<boolean>(false);
	const showToast = useCustomToast();

	useEffect(() => {
		fetchPostsFromDb(true);
	}, []);

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

	const renderPostList = useCallback(() => {
		if (isEmpty(postFromDb)) return null;

		return postFromDb.map((post: Post, index: number) => (
			<MessageListItem key={`${post.id}-${index}`} postId={post.id} post={post} isLocal={false} deletePost={() => handleDeletePost(post.id)} />
		));
	}, [postFromDb, handleDeletePost]);

	const renderPage = () => {
		return (
			<div className="relative">
				<IonList className="px-3">{renderPostList()}</IonList>
				{isLoading && <LoadingSpinner />}
			</div>
		);
	};

	return (
		<>
			<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
				<IonRefresherContent></IonRefresherContent>
			</IonRefresher>
			{renderPage()}
			<IonInfiniteScroll onIonInfinite={loadMore} threshold="100px" disabled={isInfiniteDisabled}>
				<IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Caricamento altri articoli..." />
			</IonInfiniteScroll>
		</>
	);
};

export default ArticleList;
