import { IonList, IonRefresher, IonRefresherContent } from "@ionic/react";

import MessageListItem from "./messageListItem";
import Spinner from "./ui/spinner";

import useArticles from "../hooks/useArticles";

import { isEmpty } from "lodash";
import { useEffect } from "react";

const ArticleList = ({ session }) => {
	const { postFromDb, fetchPostsFromDb } = useArticles(session);

	useEffect(() => {
		fetchPostsFromDb();
	}, []);

	const refresh = (e) => {
		setTimeout(() => {
			fetchPostsFromDb();
			e.detail.complete();
		}, 3000);
	};

	const renderPostList = () => {
		if (isEmpty(postFromDb)) return <Spinner />;

		return postFromDb.map(post => (
			<MessageListItem
				key={post.id}
				postId={post.id}
				post={post}
				isLocal={false}
				deletePost={() => { }} // Implement delete functionality
			/>
		));
	};

	return (
		<>
			<IonRefresher slot="fixed" onIonRefresh={refresh}>
				<IonRefresherContent></IonRefresherContent>
			</IonRefresher>
			<IonList className="px-3">
				{renderPostList()}
			</IonList>
		</>
	);
};

export default ArticleList;