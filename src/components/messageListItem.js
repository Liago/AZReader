import { IonImg, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonThumbnail, useIonModal } from '@ionic/react';
// import { useSelector } from 'react-redux';
import Article from './article';

const MessageListItem = ({ post, postId, deletePost }) => {
	
	// const displayLocalDot = () => {
	// 	const { userEmail } = post?.savedBy;

	// 	if (user.mail === userEmail)
	// 		return <div slot="start" className="dot dot-unread"></div>

	// 	return <></>
	// }

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
				{/* {displayLocalDot()} */}
				<IonThumbnail slot="start">
					<IonImg
						className="rounded-xl shadow-md"
						src={post.lead_image_url || post.topImage}
					/>
				</IonThumbnail>
				<div>
					<h2 className="text-sm font-bold font-[montserrat]">{post.title}</h2>
					<p className="font-light text-xs w-full">{post.domain} - {post.word_count || post.length} parole</p>
				</div>
			</IonItem>
			<IonItemOptions>
				{/* <IonItemOption>Favorite</IonItemOption> */}
				<IonItemOption color="danger" onClick={() => deletePost(post.id)}>Delete</IonItemOption>
			</IonItemOptions>
		</IonItemSliding>
	);
};

export default MessageListItem;
