import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonList, IonMenuButton, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToolbar, useIonActionSheet, useIonModal, useIonRouter, useIonToast } from "@ionic/react";
import { powerOutline, logInOutline, documentTextOutline } from "ionicons/icons";

import MainMenu from "../components/ui/menu";
import MessageListItem from "../components/messageListItem";
import ModalParser from "../components/modalParser";
import AuthenticationForm from "../components/form/auth";
import Spinner from "../components/ui/spinner";

import { onLogout, savePost } from "../store/actions";
import { getArticledParsed, saveReadingList } from "../store/rest";
import { personalScraper, rapidApiScraper } from "../common/scraper";
import { getScraperParmas } from "../utility/utils";
import { deletePostFromFirestore, getPostList, savePostToFirestore } from '../common/firestore';

import { isEmpty } from "lodash";
import moment from 'moment';

import "./Home.css";

const Home = () => {
	const dispatch = useDispatch();
	const router = useIonRouter();
	const { list } = useSelector(state => state.posts);
	const { tokenExpiration } = useSelector(state => state.app);
	const { isLogged, credentials } = useSelector(state => state.user);
	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [customArticleParsed, setCustomArticleParsed] = useState();
	const [rapidArticleParsed, setRapidArticleParsed] = useState();
	const [isParsing, setIsParsing] = useState(false);
	const [postFromDb, setPostFromDb] = useState([]);

	const [parseArticle, { data: articleParsed, loading }] = getArticledParsed(searchText);
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
	}, [isLogged])

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


		theArticleParsed['readingList'] = [credentials.user.id];
		theArticleParsed['savedBy'] = credentials.user.id;
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

	const onDeletePost = (postId) => {
		deletePostFromFirestore(postId)
			.then(() => setTimeout(() => fetchPostsFromDb(), 1000))
			.catch((err) => console.error(err));
	}



	const renderPostList = () => {
		if (isEmpty(list) && isEmpty(postFromDb)) return;
		if (!isLogged && isEmpty(list)) return <Spinner />;
		if (isLogged && isEmpty(postFromDb)) return <Spinner />;

		if (isLogged)
			return Object.keys(postFromDb).map(key => {
				return <MessageListItem key={key} postId={key} post={postFromDb[key]} isLocal={false} deletePost={onDeletePostHandler} />
			})

		return (list || []).reverse().map((item, i) => <MessageListItem key={i} post={item} isLocal />)
	}
	const fetchPostsFromDb = () => {
		setPostFromDb([]);
		getPostList('date_published', 'desc')
			.then(response => setPostFromDb(response));
	}
	const renderModalParser = () => {
		if (isParsing) return;

		const theArticleParsed = customArticleParsed ? customArticleParsed : rapidArticleParsed ?? articleParsed;

		const modalProps = { theArticleParsed, showModal, pageRef, savePostHandler, setShowModal, searchText, setSearchText, savePostToServer, loading }

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
				onClick={() => showModalLogin()}
			>
				<IonIcon slot='icon-only' icon={logInOutline} />
			</IonButton>
		)
	}

	const renderTitle = () => {
		return isLogged
			? 'Articoli condivisi'
			: 'I miei articoli'
	}

	const [remainingMinutes, setRemainingMinutes] = useState()

	const calculateToken = () => {
		const currentTime = moment().unix();
		const _remainingMinutes = moment.duration(tokenExpiration - currentTime, 'seconds').minutes();
		if (_remainingMinutes < 0)
			dispatch(onLogout())

		setRemainingMinutes(_remainingMinutes);
	}

	useEffect(() => {
		const comInterval = setInterval(calculateToken, 60000);
		return () => clearInterval(comInterval)
	}, [])

	const renderTokenExpiration = () => {
		if (!tokenExpiration)
			return <span>Sessione locale.</span>

		return <span className="text-xs font-[lato]">Scadenza sessione: {remainingMinutes} minuti</span>
	}
	return (
		<>
			<MainMenu />
			<IonPage id="home-page" ref={pageRef}>
				<IonHeader>
					<IonToolbar>
						{renderTokenExpiration()}
						<IonButtons slot="start">
							<IonMenuButton></IonMenuButton>
						</IonButtons>
						<IonTitle>{renderTitle()}</IonTitle>
						<IonButtons slot="primary">
							{renderLoginLogout()}
							<IonButton
								color="dark"
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
