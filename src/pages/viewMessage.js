import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';

import {
	IonBackButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonPage,
	IonToolbar,
} from '@ionic/react';


import { find } from 'lodash';

import './ViewMessage.css';

const ViewMessage = () => {
	const [post, setPost] = useState();
	const { list } = useSelector(state => state.posts);
	const params = useParams();

	const getPost = id => find(list, ['id', parseInt(id)]);

	useEffect(() => {
		const post = getPost(params.id);
		setPost(post);
	}, []);


	return (
		<IonPage id="view-message-page">
			<IonHeader translucent>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton text="back" defaultHref="/home"></IonBackButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<div className="p-4">
					<p className="text-3xl font-medium text-left" dangerouslySetInnerHTML={{ __html: post?.title }}></p>
					<p className="text-xs font-normal">{post.domain}</p>
					<div className="pt-4 text-justify">
						<p dangerouslySetInnerHTML={{ __html: post?.content }}></p>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
}

export default ViewMessage;
