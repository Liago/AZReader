import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonList, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToolbar, useIonModal, useIonToast } from "@ionic/react";
import { powerOutline, logInOutline, documentTextOutline } from "ionicons/icons";

import MessageListItem from "../components/messageListItem";
import ModalParser from "../components/modalParser";
import AuthenticationForm from "../components/form/auth";
import Spinner from "../components/ui/spinner";

import { onLogout, savePost } from "../store/actions";
import { getArticledParsed, getPostFromDb, savePostToDb, saveReadingList } from "../store/rest";
import { personalScraper } from "../common/scraper";

import "./Home.css";

import { isEmpty } from "lodash";
import moment from 'moment';
import { getScraperParmas } from "../utility/utils";

const Home = () => {
	const dispatch = useDispatch();
	const { list } = useSelector(state => state.posts);
	const { tokenExpiration } = useSelector(state => state.app);
	const { isLogged, credentials } = useSelector(state => state.user);
	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [customArticleParsed, setCustomArticleParsed] = useState();
	const [isParsing, setIsParsing] = useState(false);

	const [parseArticle, { data: articleParsed, loading, error: notParsed }] = getArticledParsed(searchText);
	const [save, { data: postSaved, error }] = savePostToDb();
	const [getPosts, { data: postFromDb }] = getPostFromDb();
	const [saveArticleAccess] = saveReadingList();

	const pageRef = useRef();

	const [showToast, dismissToast] = useIonToast();


	const handleDismiss = () => dismissModalLogin();
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

		if (getScraperParmas(searchText)) {
			personalScraper(searchText)
				.then(resp => {
					console.log('articolo', resp[0])
					setCustomArticleParsed(resp[0])
				});
			setIsParsing(false);
			return;
		}

		parseArticle();
		setIsParsing(false)

	}, [searchText])

	const savePostHandler = () => {
		const theArticleParsed = customArticleParsed ? customArticleParsed : articleParsed;

		dispatch(savePost(theArticleParsed));
		setSearchText('');
		setShowModal(false);
	}

	const savePostToServer = () => {
		const theArticleParsed = customArticleParsed ? customArticleParsed : articleParsed;

		theArticleParsed['readingList'] = [credentials.id];
		theArticleParsed['id'] = Date.now();
		save(theArticleParsed);
		saveArticleAccess({
			user: credentials.id,
			docs: [theArticleParsed.id]
		});
		!error && setSearchText('');
		setShowModal(false);
		setTimeout(() => {
			fetchPostsFromDb();
		}, 500)
	}

	const renderPostList = () => {
		if (isEmpty(list) && isEmpty(postFromDb)) return;
		if (!isLogged && isEmpty(list)) return <Spinner />;
		if (isLogged && isEmpty(postFromDb)) return <Spinner />;

		if (isLogged)
			return Object.keys(postFromDb).reverse().map(key => {
				return <MessageListItem key={key} postId={key} post={postFromDb[key]} isLocal={false} />
			})

		return (list || []).map((item, i) => <MessageListItem key={i} post={item} isLocal />)
	}
	const fetchPostsFromDb = () => {
		getPosts()
	}
	const renderModalParser = () => {
		if (isParsing) return;

		const theArticleParsed = customArticleParsed ? customArticleParsed : articleParsed;

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
		<IonPage id="home-page" ref={pageRef}>
			<IonHeader>
				<IonToolbar>
					{renderTokenExpiration()}
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
	);
};

export default Home;
