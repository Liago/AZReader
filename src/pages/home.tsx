import { useRef } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { powerOutline, logInOutline, documentTextOutline } from "ionicons/icons";
import { Session } from "@supabase/supabase-js";
import { ArticleParsed } from "@common/interfaces";
import ArticleParserModal from "@components/ArticleParserModal";
import { Auth } from "@components/form/authentication";
import ArticleList from "@components/ArticleList";
import useAuth from "@hooks/useAuth";
import useArticles from "@hooks/useArticles";
import { supabase, pg_stat_clear_snapshot } from "@store/rest";

const Home: React.FC = () => {
	const { session, signOut } = useAuth();
	const {
		showModal,
		setShowModal,
		isParsing,
		articleParsed,
		savePostHandler,
		savePostToServer,
		setSearchText,
		parseArticleError
	} = useArticles(session as Session | null);

	const pageRef = useRef<HTMLElement>(null);

	const renderTitle = (): string => (session ? "Articoli condivisi" : "I miei articoli");

	const handleUrlSubmit = (url: string) => {
		setSearchText(url);
	};

	// Funzione per aggiornare lo schema del database prima di salvare
	const clearSchemaCache = async () => {
		// NON chiamiamo pg_stat_clear_snapshot() perché genera errore PGRST202
		// Questo è normale perché la funzione non esiste nel database
		console.log("Ignorato aggiornamento cache schema (funzione non disponibile)");
		return false;
	};

	// Wrapper per il salvataggio che prima pulisce la cache
	const handleSaveWithCacheClear = async (article: ArticleParsed | null) => {
		try {
			// Controlliamo se abbiamo un articolo (potrebbe essere passato come parametro o usato dall'interno)
			console.log("Salvataggio articolo con pulizia cache:", article || articleParsed);

			// Tentiamo di pulire la cache ma non blocchiamo se fallisce
			await clearSchemaCache();

			// Se abbiamo un articolo passato come parametro, usiamo savePostToServer con l'articolo
			if (article) {
				await savePostToServer(article);
			} else {
				// Altrimenti usiamo savePostHandler senza parametri (che userà articleParsed dal contesto)
				savePostHandler();
			}
		} catch (err) {
			console.error("Errore durante il salvataggio con pulizia cache:", err);
		}
	};

	const renderContent = (): JSX.Element => {
		if (!session) {
			return <Auth />;
		}

		return (
			<>
				<ArticleList session={session as Session} />
				<ArticleParserModal
					isOpen={showModal}
					onClose={() => setShowModal(false)}
					onSave={handleSaveWithCacheClear}
					onSubmitUrl={handleUrlSubmit}
					article={articleParsed}
					isLoading={isParsing}
					session={session}
					error={parseArticleError}
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
