import { useRef } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { powerOutline, logInOutline, documentTextOutline } from "ionicons/icons";
import { Session } from "@supabase/supabase-js";
import { ArticleParsed } from "@common/interfaces";
import ArticlePreviewModal from "@components/ArticlePreviewModal";
import { Auth } from "@components/form/authentication";
import ArticleList from "@components/ArticleList";
import useAuth from "@hooks/useAuth";
import useArticles from "@hooks/useArticles";

const Home: React.FC = () => {
	const { session, signOut } = useAuth();
	const {
		showModal,
		setShowModal,
		isParsing,
		articleParsed,
		savePostHandler,
		savePostToServer,
		setSearchText
	} = useArticles(session as Session | null);

	const pageRef = useRef<HTMLElement>(null);

	const renderTitle = (): string => (session ? "Articoli condivisi" : "I miei articoli");

	const handleUrlSubmit = (url: string) => {
		setSearchText(url);
	};

	const renderContent = (): JSX.Element => {
		if (!session) {
			return <Auth />;
		}

		return (
			<>
				<ArticleList session={session as Session} />
				<ArticlePreviewModal
					isOpen={showModal}
					onClose={() => setShowModal(false)}
					onSave={savePostHandler}
					article={articleParsed}
					isLoading={isParsing}
					session={session}
					onUrlSubmit={handleUrlSubmit}
				/>
			</>
		);
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
