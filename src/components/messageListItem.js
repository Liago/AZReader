import { IonImg, IonItem, IonLabel, IonThumbnail, useIonModal } from '@ionic/react';
import Article from './article';

import './MessageListItem.css';


const MessageListItem = ({ post, isLocal, postId }) => {
	const displayLocalDot = () => {
		if (isLocal)
			return <div slot="start" className="dot dot-unread"></div>

		return <div slot="start" className="dot dot-unread"></div>
	}

	const openArticle = () => present()
	const dismissHandler = () => dismiss()

	const [present, dismiss] = useIonModal(Article, {
		articleParsed: post,
		postId: postId,
		onDismiss: dismissHandler,
	});

	return (
		<IonItem
			lines="none"
			className="py-3"
			onClick={() => openArticle()}
		>
			{/* {displayLocalDot()} */}
			<IonThumbnail slot="start">
				<IonImg
					className="rounded-xl shadow-md"
					src={post.lead_image_url}
				/>
			</IonThumbnail>
			<div>
				<h2 className="text-sm font-bold font-[montserrat]">{post.title}</h2>
				<p className="font-light text-xs ">{post.domain} - {post.word_count} parole</p>
			</div>
		</IonItem>
	);
};

export default MessageListItem;
