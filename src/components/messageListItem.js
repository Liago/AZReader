import { IonAvatar, IonImg, IonItem, IonLabel, IonNote, IonThumbnail, useIonModal } from '@ionic/react';
import { getDataFormatted } from '../utility/utils';
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
		<IonItem onClick={() => openArticle()}>
			{/* {displayLocalDot()} */}
			<IonThumbnail slot="start">
				<IonImg
					className="rounded-xl shadow-md"
					src={post.lead_image_url}
				/>
			</IonThumbnail>
			<IonLabel className="ion-text-wrap">
				<h2>{post.title}</h2>
				<p>{post.domain}</p>
			</IonLabel>
		</IonItem>
	);
};

export default MessageListItem;
