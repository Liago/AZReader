import React, { useRef, useState } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { powerOutline, logInOutline, documentTextOutline } from "ionicons/icons";

import MainMenu from "../components/ui/menu";
import ModalParser from "../components/modalParser";
import { Auth, Account } from "../components/form/authentication";
import ArticleList from "../components/articleList";

import useAuth from "../hooks/useAuth";
import useArticles from "../hooks/useArticles";

import "./Home.css";

const Home = () => {
	const { session, signOut } = useAuth();
	const {
		showModal, setShowModal,
		searchText, setSearchText,
		isParsing, articleParsed,
		savePostHandler, savePostToServer,
		loading
	} = useArticles(session);

	const pageRef = useRef();

	const renderTitle = () => session ? 'Articoli condivisi' : 'I miei articoli';

	const renderContent = () => {
		if (!session) {
			return <Auth />;
		}

		return (
			<>
				<ArticleList session={session} />
				{renderModalParser()}
			</>
		);
	};

	const renderModalParser = () => {
		if (isParsing) return null;

		const modalProps = {
			articleParsed,
			showModal,
			pageRef,
			savePostHandler,
			setShowModal,
			searchText,
			setSearchText,
			savePostToServer,
			loading
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
							<IonMenuButton></IonMenuButton>
						</IonButtons>
						<IonTitle>{renderTitle()}</IonTitle>
						<IonButtons slot="primary">
							{session ? (
								<IonButton color="dark" onClick={signOut}>
									<IonIcon slot='icon-only' icon={powerOutline} />
								</IonButton>
							) : (
								<IonButton color="dark" onClick={() => setShowModal(true)}>
									<IonIcon slot='icon-only' icon={logInOutline} />
								</IonButton>
							)}
							<IonButton color="dark" onClick={() => setShowModal(true)}>
								<IonIcon slot='icon-only' icon={documentTextOutline} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent fullscreen>
					{renderContent()}
				</IonContent>
			</IonPage>
			{session && <Account session={session} />}
		</>
	);
};

export default Home;