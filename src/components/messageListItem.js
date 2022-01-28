import { IonItem, IonLabel, IonNote } from '@ionic/react';
import { getDataFormatted } from '../utility/utils';

import './MessageListItem.css';


const MessageListItem = ({ post }) => {

	return (
		<IonItem routerLink={`/message/${post.id}`} detail={false}>
			<div slot="start" className="dot dot-unread"></div>
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
