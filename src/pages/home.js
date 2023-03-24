import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonList, IonMenuButton, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToolbar, useIonActionSheet, useIonModal, useIonRouter, useIonToast } from "@ionic/react";
import { powerOutline, logInOutline, documentTextOutline } from "ionicons/icons";

import MainMenu from "../components/ui/menu/menu";
import MessageListItem from "../components/messageListItem";
import ModalParser from "../components/modalParser";
import AuthenticationForm from "../components/form/auth";
import { FilterAndSort } from "../components/toolbar/filterAndSort";
import Spinner from "../components/ui/spinner";

import { onLogout, savePost } from "../store/actions";
import { getArticledParsed } from "../store/rest";
import { personalScraper, rapidApiScraper } from "../common/scraper";
import { getScraperParmas } from "../utility/utils";
import { deletePostFromFirestore, getPostList, savePostToFirestore } from '../common/requests/posts';

import { filter, isEmpty } from "lodash";
import moment from 'moment';

import "./Home.css";


const Home = () => {
	const dispatch = useDispatch();
	const router = useIonRouter();
	const { list } = useSelector(state => state.posts);
	const { tokenExpiration, sort, feedType } = useSelector(state => state.app);
	const { isLogged } = useSelector(state => state.user);
	const { user } = useSelector(state => state.user?.credentials);
	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [customArticleParsed, setCustomArticleParsed] = useState();
	const [rapidArticleParsed, setRapidArticleParsed] = useState();
	const [isParsing, setIsParsing] = useState(false);
	const [postFromDb, setPostFromDb] = useState([]);
	const [parseArticle, { data: articleParsed, loading, error }] = getArticledParsed(searchText);
	// const [saveArticleAccess] = saveReadingList();
	const pageRef = useRef();

	const [showToast, dismissToast] = useIonToast();
	const [confirm] = useIonActionSheet();

	const handleDismiss = (res) => {
		if (res?.success) {
			dismissModalLogin()
			router.push('/verify-email');
			return;
		}

		dismissModalLogin()

	};
	const [showModalLogin, dismissModalLogin] = useIonModal(AuthenticationForm, {
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
				buttons: [{ text: 'log in', handler: () => showModalLogin() }],
				color: "warning",
				duration: 5000,
				onDidDismiss: () => dismissToast
			})
		}

		isLogged && fetchPostsFromDb()
	}, [isLogged, sort, feedType])

	const refresh = (e) => {
		setTimeout(() => {
			isLogged && fetchPostsFromDb();
			e.detail.complete();
		}, 3000);
	};

	useEffect(() => {
		if (searchText === '') return;
		setIsParsing(true);
		setCustomArticleParsed(null);
		setRapidArticleParsed(null);

		const parserParams = getScraperParmas(searchText);

		if (!parserParams?.parser) {
			parseArticle();
			setIsParsing(false);
			return;
		}
		switch (parserParams.parser) {
			case 'personal':
				personalScraper(searchText)
					.then(resp => {
						console.log('articolo', resp[0])
						setCustomArticleParsed(resp[0])
					});
				break;
			case 'rapidApi':
				rapidApiScraper(searchText)
					.then(resp => {
						console.log('resp', resp)
						setRapidArticleParsed(resp);
					});
				break;
			default:
				parseArticle();
		}

		setIsParsing(false);
	}, [searchText])


	const savePostHandler = () => {
		if (rapidArticleParsed) {
			const url = new URL(rapidArticleParsed.url);
			rapidArticleParsed['domain'] = url.hostname;
		}
		const theArticleParsed = customArticleParsed ? customArticleParsed : rapidArticleParsed ?? articleParsed;

		dispatch(savePost(theArticleParsed));
		setSearchText('');
		setShowModal(false);
	}
	const savePostToServer = () => {
		if (rapidArticleParsed) {
			const url = new URL(rapidArticleParsed.url);
			rapidArticleParsed['domain'] = url.hostname;
		}
		const theArticleParsed = customArticleParsed ? customArticleParsed : rapidArticleParsed ?? articleParsed;
		theArticleParsed['savedBy'] = { userId: user.id, userEmail: user.mail };
		theArticleParsed['savedOn'] = Date.now();

		savePostToFirestore(theArticleParsed)
			.then(response => {
				console.log('response :>> ', response);
			})
			.catch(err => {
				console.log('err :>> ', err);
			})


		setSearchText('');
		setShowModal(false);
		setTimeout(() => {
			fetchPostsFromDb();
		}, 500)
	}
	const onDeletePostHandler = (postId) => {
		confirm(
			{
				header: 'Sei sicuro?',
				subHeader: 'La cancellazione è irreversibile, non sarà possibile recuperare l\'articolo',
				cssClass: 'action-sheet-custom',
				buttons: [{
					text: 'Sì, cancella',
					role: 'destructive',
					data: {
						type: 'delete'
					},
					handler: () => onDeletePost(postId)
				}, {
					text: 'No, annulla',
					role: 'cancel'
				}],
			})
	}
	const onDeletePost = async (postId) => {
		const response = await deletePostFromFirestore(postId)
		setTimeout(() => fetchPostsFromDb(), 1000)
	}

	const renderPostList = () => {
		if (isEmpty(list) && isEmpty(postFromDb)) return;
		if (!isLogged && isEmpty(list)) return <Spinner />;
		if (isLogged && isEmpty(postFromDb)) return <Spinner />;
		let posts = [];

		if (isLogged)
			switch (feedType) {
				case 'All':
					posts = filter(postFromDb, (post) => post.readingList.indexOf(user.id) >= 0)
					break;
				case 'Personal':
					posts = filter(postFromDb, (post) => post.savedBy.userId === user.id)
					break;
				default:
					break;
			}

		return Object.keys(posts).map(key => {
			return <MessageListItem key={key} postId={key} post={posts[key]} isLocal={false} deletePost={onDeletePostHandler} />
		})
	}

	const fetchPostsFromDb = async () => {
		setPostFromDb([]);
		const response = await getPostList(sort?.by, sort?.asc)
		setPostFromDb(response)
	}



	const renderModalParser = () => {
		if (isParsing) return;

		const theArticleParsed = customArticleParsed ? customArticleParsed : rapidArticleParsed ?? articleParsed;

		const modalProps = { theArticleParsed, showModal, pageRef, savePostHandler, setShowModal, searchText, setSearchText, savePostToServer, loading }

		return <ModalParser {...modalProps} />
	}

	const renderTitle = () => {
		if (isLogged && feedType === 'Personal') 
			return 'I miei articoli'

		return 'Articoli condivisi'
	}

	return (
		<>
			<MainMenu
				isLogged={isLogged}
				showModalLogin={showModalLogin}
			/>
			<IonPage id="home-page" ref={pageRef}>
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonMenuButton></IonMenuButton>
						</IonButtons>
						<IonTitle>{renderTitle()}</IonTitle>
						<FilterAndSort />
						<IonButtons slot="primary">
							<IonButton
								color="success"
								onClick={() => setShowModal(true)}
							>
								<IonIcon slot='icon-only' icon={documentTextOutline} />
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
							<IonTitle size="large">{renderTitle()}</IonTitle>
						</IonToolbar>
					</IonHeader>
					<IonList className="px-3">
						{renderPostList()}
					</IonList>
					{renderModalParser()}
				</IonContent >
			</IonPage >
		</>
	);
};

export default Home;
