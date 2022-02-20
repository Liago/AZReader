import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonList, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToolbar, useIonModal, useIonToast } from "@ionic/react";
import { eyeSharp, powerOutline, pulse, umbrellaSharp, alarm } from "ionicons/icons";

import MessageListItem from "../components/messageListItem";
import ModalParser from "../components/modalParser";
import AuthenticationForm from "../components/form/auth";

import { onLogout, savePost } from "../store/actions";
import { getArticledParsed, getPostFromDb, savePostToDb, saveReadingList } from "../store/rest";

import "./Home.css";

import { isEmpty } from "lodash";
import moment from 'moment'

const Home = () => {
	const dispatch = useDispatch();
	const { list } = useSelector(state => state.posts);
	const { tokenExpiration } = useSelector(state => state.app);
	const { isLogged, credentials } = useSelector(state => state.user);
	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [parseArticle, { data: articleParsed, loading }] = getArticledParsed(searchText);
	const [save, { data: postSaved, error }] = savePostToDb();
	const [getPosts, { data: postFromDb }] = getPostFromDb();
	const [saveArticleAccess] = saveReadingList();

	const pageRef = useRef();

	const [showToast, dismissToast] = useIonToast();


	const handleDismiss = () => dismiss();
	const [present, dismiss] = useIonModal(AuthenticationForm, {
		mode: 'SIGNIN',
		onDismiss: handleDismiss,
		breakpoints: [0.1, 0.5, 1],
		initialBreakpoint: 0.5,
	});

	useEffect(() => {
		//verifica che il token sia ancora valido
		if (moment().unix() > tokenExpiration) {
			dispatch(onLogout());
			showToast({
				message: 'Token scaduto. Devi ricollegarti.',
				buttons: [{ text: 'log in', handler: () => present() }],
				color: "warning",
				onDidDismiss: () => dismissToast
			})
		}

		isLogged && fetchPostsFromDb()
	}, [isLogged])

	const refresh = (e) => {
		setTimeout(() => {
			e.detail.complete();
		}, 3000);
	};

	useEffect(() => {
		if (searchText === '') return;
		
		parseArticle();
	}, [searchText])

	const savePostHandler = () => {
		dispatch(savePost(articleParsed));
		setSearchText('');
	}

	const savePostToServer = () => {
		articleParsed['readingList'] = [credentials.id];
		articleParsed['id'] = Date.now();
		save(articleParsed);
		saveArticleAccess({
			user: credentials.id,
			docs: [articleParsed.id]
		});
		if(!error){
			setSearchText('');
		}
	}

	const renderPostList = () => {
		if (!isLogged && isEmpty(list)) return;
		if (isLogged && isEmpty(postFromDb)) return;

		if (isLogged)

			return Object.keys(postFromDb).map((p, i) => {
				return <MessageListItem key={i} post={postFromDb[p]} isLocal={false} />
			})

		return (list || []).map((item, i) => <MessageListItem key={i} post={item} isLocal />)
	}
	const fetchPostsFromDb = () => {
		getPosts()
	}
	const renderModalParser = () => {
		const modalProps = { articleParsed, showModal, pageRef, savePostHandler, setShowModal, searchText, setSearchText, savePostToServer }

		return <ModalParser {...modalProps} />
	}

	const renderLoginLogout = () => {
		if (isLogged)
			return (
				<IonButton
					color="dark"
					onClick={() => dispatch(onLogout())}
				>
					<IonIcon slot='icon-only' icon={powerOutline} />
				</IonButton>
			)

		return (
			<IonButton
				color="dark"
				onClick={() => present()}
			>
				<IonIcon slot='icon-only' icon={umbrellaSharp} />
			</IonButton>
		)
	}

	return (
		<IonPage id="home-page" ref={pageRef}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Articoli</IonTitle>
					<IonButtons slot="primary">
						{renderLoginLogout()}
						<IonButton
							color="dark"
							onClick={() => setShowModal(true)}
						>
							<IonIcon slot='icon-only' icon={pulse} />
						</IonButton>
						<IonButton
							color="dark"
							onClick={() => fetchPostsFromDb()}
						>
							<IonIcon slot='icon-only' icon={eyeSharp} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonRefresher slot="fixed" onIonRefresh={refresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>

				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Articoli</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonList>
					{renderPostList()}
				</IonList>
				{renderModalParser()}
			</IonContent >
		</IonPage >
	);
};

export default Home;
