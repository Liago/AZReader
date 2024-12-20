import { useRef } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { powerOutline, logInOutline, documentTextOutline } from "ionicons/icons";
import { Session } from "@supabase/auth-js/dist/module/lib/types";

import { ArticleParsed } from "@common/interfaces";

import MainMenu from "@components/ui/menu";
import ModalParser from "@components/modalParser";
import { Auth } from "@components/form/authentication";
import ArticleList from "@components/articleList";

import useAuth from "@hooks/useAuth";
import useArticles from "@hooks/useArticles";

import "./Home.css";

interface ModalProps {
	articleParsed: ArticleParsed | null;
	showModal: boolean;
	pageRef: React.RefObject<HTMLElement>;
	savePostHandler: () => void;
	setShowModal: (show: boolean) => void;
	searchText: string;
	setSearchText: (text: string) => void;
	savePostToServer: () => void;
	loading: boolean;
	isParsing: boolean;
}

const Home: React.FC = () => {
	const { session, signOut } = useAuth();
	const { showModal, setShowModal, searchText, setSearchText, isParsing, articleParsed, savePostHandler, savePostToServer, loading } = useArticles(
		session as Session | null
	);

	const pageRef = useRef<HTMLElement>(null);

	const renderTitle = (): string => (session ? "Articoli condivisi" : "I miei articoli");

	const renderContent = (): JSX.Element => {
		if (!session) {
			return <Auth />;
		}

		return (
			<>
				<ArticleList session={session as Session} />
				{renderModalParser()}
			</>
		);
	};

	const renderModalParser = (): JSX.Element | null => {
		const modalProps: ModalProps = {
			articleParsed,
			showModal,
			pageRef,
			savePostHandler,
			setShowModal,
			searchText,
			setSearchText,
			savePostToServer,
			loading,
			isParsing,
		};

		return <ModalParser {...modalProps} />;
	};

	return (
		<>
			<MainMenu />
			<IonPage id="home-page" ref={pageRef}>
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonMenuButton />
						</IonButtons>
						<IonTitle>{renderTitle()}</IonTitle>
						<IonButtons slot="primary">
							{session ? (
								<IonButton color="dark" onClick={signOut}>
									<IonIcon slot="icon-only" icon={powerOutline} />
								</IonButton>
							) : (
								<IonButton color="dark" onClick={() => setShowModal(true)}>
									<IonIcon slot="icon-only" icon={logInOutline} />
								</IonButton>
							)}
							<IonButton color="dark" onClick={() => setShowModal(true)}>
								<IonIcon slot="icon-only" icon={documentTextOutline} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent fullscreen>{renderContent()}</IonContent>
			</IonPage>
			{/* {session && <Account session={session} />} */}
		</>
	);
};

export default Home;
