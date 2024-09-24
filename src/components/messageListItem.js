import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, useIonModal } from '@ionic/react';

import Article from './article';
import PostItem from './ui/NewsItem';

import './MessageListItem.css';

import moment from "moment";

const MessageListItem = ({ post, isLocal, postId, deletePost }) => {
	const displayLocalDot = () => {
		if (isLocal)
			return <div slot="start" className="dot dot-unread"></div>;
		return <div slot="start" className="dot dot-unread"></div>;
	};

	const openArticle = () => present()
	const dismissHandler = () => dismiss()

	const [present, dismiss] = useIonModal(Article, {
		articleParsed: post,
		postId: postId,
		onDismiss: dismissHandler,
	});

	return (
		<IonItemSliding>
			<IonItem
				lines="none"
				className="py-3 border-b border-gray-200"
				onClick={() => openArticle()}
			>
				<PostItem {...post}
					source={post.domain || post.source}
					imageUrl={post.lead_image_url || post.topImage || 'https://placehold.co/100x100'}
					published={moment(post.date_published).format('MMM DD')}
				/>
			</IonItem>
			<IonItemOptions>
				<IonItemOption color="danger" onClick={() => deletePost(post.id)}>Delete</IonItemOption>
			</IonItemOptions>
		</IonItemSliding>
	);
};


export default MessageListItem;
