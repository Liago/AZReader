import { useRef } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { powerOutline, logInOutline, documentTextOutline } from "ionicons/icons";
import { Session } from "@supabase/auth-js/dist/module/lib/types"; // Percorso corretto per il tipo Session
import { ArticleParsed } from "@common/interfaces";
import ModalParser from "@components/ModalParser";
import { Auth } from "@components/form/authentication";
import ArticleList from "@components/ArticleList";
import useAuth from "@hooks/useAuth";
import useArticles from "@hooks/useArticles";

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
	session: Session | null;
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
			session: session as Session | null,
		};

		return <ModalParser {...modalProps} />;
	};

	return (
		<>
			<IonPage id="home-page" ref={pageRef}>
				<IonHeader className="ion-no-border">
					<IonToolbar>
						<IonButtons slot="start">
							<IonMenuButton autoHide={false} />
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
				<IonContent>
					{renderContent()}
				</IonContent>
			</IonPage>
		</>
	);
};

export default Home;
