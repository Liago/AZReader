import { useState, useRef } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar, IonTabBar, IonTabButton, IonTabs, IonRouterOutlet } from "@ionic/react";
import { searchOutline, bookmarkOutline, notificationsOutline, personOutline, homeOutline, shareOutline } from "ionicons/icons";
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
	const [activeTab, setActiveTab] = useState('latest');


	const getCurrentDate = (): string => {
		const today = new Date();
		const options: Intl.DateTimeFormatOptions = { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		};
		return today.toLocaleDateString('en-US', options);
	};

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
		<IonPage id="home-page" ref={pageRef}>
			<IonHeader className="ion-no-border bg-white">
				<IonToolbar className="bg-white">
					<IonButtons slot="start">
						<IonMenuButton autoHide={false} color="dark" />
					</IonButtons>
					<div className="flex flex-col items-center">
						<IonTitle className="text-xl font-bold text-black">Today's News</IonTitle>
						<p className="text-sm text-gray-500">{getCurrentDate()}</p>
					</div>
					<IonButtons slot="primary">
						<IonButton color="dark">
							<IonIcon slot="icon-only" icon={searchOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
				
				{/* Tab Navigation */}
				<div className="px-4 pb-2 bg-white">
					<div className="flex space-x-1 bg-gray-100 rounded-full p-1">
						{[
							{ id: 'latest', label: 'Latest' },
							{ id: 'world', label: 'World' },
							{ id: 'politics', label: 'Politics' },
							{ id: 'climate', label: 'Climate' }
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex-1 py-2 px-4 text-sm font-medium rounded-full transition-all ${
									activeTab === tab.id
										? 'bg-black text-white'
										: 'text-gray-600 hover:text-black'
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>
			</IonHeader>
			
			<IonContent>
				{renderContent()}
			</IonContent>
			
			{/* Bottom Navigation */}
			<IonTabBar slot="bottom" className="bg-white border-t border-gray-200">
				<IonTabButton tab="home" href="/home">
					<IonIcon icon={homeOutline} className="mb-1" />
					<span className="text-xs font-medium text-black">Home</span>
				</IonTabButton>
				<IonTabButton tab="saved" href="/saved">
					<IonIcon icon={bookmarkOutline} className="mb-1" />
					<span className="text-xs font-medium text-gray-500">Saved</span>
				</IonTabButton>
				<IonTabButton tab="notifications" href="/notifications">
					<IonIcon icon={notificationsOutline} className="mb-1" />
					<span className="text-xs font-medium text-gray-500">Notifications</span>
				</IonTabButton>
				<IonTabButton tab="profile" href="/profile">
					<IonIcon icon={personOutline} className="mb-1" />
					<span className="text-xs font-medium text-gray-500">Profile</span>
				</IonTabButton>
			</IonTabBar>
		</IonPage>
	);
};

export default Home;
