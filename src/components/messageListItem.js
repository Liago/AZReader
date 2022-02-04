import { IonItem, IonLabel, IonNote, useIonModal } from '@ionic/react';
import { getDataFormatted } from '../utility/utils';
import Article from './article';

import './MessageListItem.css';


const MessageListItem = ({ post, isLocal }) => {
	const displayLocalDot = () => {
		if (isLocal) 
			return <div slot="start" className="dot dot-unread"></div>
		
		return <div slot="start" className="dot dot-unread"></div>
	}

	const openArticle = () => present()
	const dismissHandler = () => dismiss()

	const [present, dismiss] = useIonModal(Article, {
		articleParsed: post,
		onDismiss: dismissHandler,
	  });

	return (
		// <IonItem routerLink={`/article/${post.id}`} detail={false}>
		 <IonItem onClick={() => openArticle()}>
			{displayLocalDot()}
			<IonLabel className="ion-text-wrap">
				<h2>
					{post.domain}
					<span className="date">
						<IonNote>{getDataFormatted(post.date_published, 'DD/MM/YYYY')}</IonNote>
					</span>
				</h2>
				<h3>{post.title}</h3>
				<p>{post.excerpt}</p>
			</IonLabel>
		</IonItem>
	);
};

export default MessageListItem;
