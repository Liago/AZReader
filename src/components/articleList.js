import React, { useEffect, useState, useCallback } from "react";
import {
	IonList,
	IonRefresher,
	IonRefresherContent,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonSpinner
} from "@ionic/react";
import MessageListItem from "./messageListItem";
import useArticles from "../hooks/useArticles";
import { useCustomToast } from "../hooks/useIonToast";
import { deletePost } from "../store/rest";
import { isEmpty } from "lodash";

const ArticleList = ({ session }) => {
	const { postFromDb, fetchPostsFromDb, changePage, pagination, isLoading, refresh } = useArticles(session);
	const [isInfiniteDisabled, setInfiniteDisabled] = useState(false);
	const showToast = useCustomToast();

	useEffect(() => {
		fetchPostsFromDb(true);
	}, []);

	useEffect(() => {
		setInfiniteDisabled(postFromDb.length >= pagination.totalItems);
	}, [postFromDb, pagination.totalItems]);

	const handleRefresh = useCallback(async (event) => {
		await refresh();
		event.detail.complete();
	}, [refresh]);

	const loadMore = useCallback((event) => {
		const nextPage = pagination.currentPage + 1;
		changePage(nextPage);
		event.target.complete();
	}, [pagination.currentPage, changePage]);

	const handleDeletePost = useCallback(async (postId) => {
		try {
			await deletePost(postId);
			showToast({
				message: `Articolo cancellato con successo!`,
				color: "success",
			});
			refresh();
		} catch (error) {
			showToast({
				message: error.message || "Errore durante l'eliminazione dell'articolo",
				color: "danger",
			});
		}
	}, [showToast, refresh]);

	const renderPostList = useCallback(() => {
		if (isEmpty(postFromDb)) return null;
		return postFromDb.map((post, index) => (
			<MessageListItem
				key={`${post.id}-${index}`}
				postId={post.id}
				post={post}
				isLocal={false}
				deletePost={() => handleDeletePost(post.id)}
				onRefresh={handleRefresh}
			/>
		));
	}, [postFromDb, handleDeletePost, handleRefresh]);
	

	return (
		<>
			<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
				<IonRefresherContent></IonRefresherContent>
			</IonRefresher>
			{isLoading && postFromDb.length === 0 ? (
				<div className="ion-text-center">
					<IonSpinner name="circular" />
				</div>
			) : (
				<IonList className="px-3">
					{renderPostList()}
				</IonList>
			)}
			<IonInfiniteScroll
				onIonInfinite={loadMore}
				threshold="100px"
				disabled={isInfiniteDisabled}
			>
				<IonInfiniteScrollContent
					loadingSpinner="bubbles"
					loadingText="Caricamento altri articoli..."
				/>
			</IonInfiniteScroll>
		</>
	);
};

export default ArticleList;