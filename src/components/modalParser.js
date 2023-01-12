import { useEffect } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonPage, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react"
import { close, saveOutline, shareSocial } from "ionicons/icons";

import Spinner from './ui/spinner';
import Article from "./article";

import { isNil } from 'lodash';
import { isValidUrl } from "../utility/utils";


const ModalParser = ({ theArticleParsed, showModal, pageRef, savePostHandler, setShowModal, searchText, setSearchText, savePostToServer, loading }) => {

	const onDismissHandler = () => {
		setSearchText('');
	}

	const dismissModalHandler = () => {
		setSearchText('');
		setShowModal(false);
	}

	const renderArticlePreview = () => {
		if (!theArticleParsed || !searchText) return;

		return <Article
			articleParsed={theArticleParsed}
			onDismiss={onDismissHandler}
			displayFrom="modalPreview"
		/>
	}

	const renderSpinner = () => {
		if ((loading && searchText === '') || theArticleParsed) return;

		return <Spinner />
	}

	const checkValid = (textString) => {
		if (!isValidUrl(textString)) {
			setSearchText('');
			return;
		};

		setSearchText(textString);
	}

	const renderSearchBar = () => {
		if (searchText !== '') return;

		return (
			<IonSearchbar
				animated
				value={searchText}
				placeholder="Url articolo"
				debounce={1000}
				onIonChange={(e) => checkValid(e.detail.value)}
			/>
		)
	}

	return (
		<IonModal
			isOpen={showModal}
			swipeToClose={true}
			presentingElement={pageRef.current || undefined}
		>
			<IonContent>
				<IonPage>
					<IonHeader>
						<IonToolbar>
							<IonTitle slot="start">Post parser</IonTitle>
							<IonButtons slot="start">
								<IonButton
									disabled={isNil(theArticleParsed) || searchText === ''}
									color='dark'
									onClick={savePostHandler}
								>
									<IonIcon slot='icon-only' icon={saveOutline} />
								</IonButton>
								<IonButton
									disabled={isNil(theArticleParsed) || searchText === ''}
									color='dark'
									onClick={savePostToServer}
								>
									<IonIcon slot='icon-only' icon={shareSocial} />
								</IonButton>
							</IonButtons>
							<IonButtons slot="end">
								<IonButton onClick={() => dismissModalHandler()}>
									<IonIcon slot="icon-only" icon={close} />
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent fullscreen>
						{renderSearchBar()}
						{renderSpinner()}
						{renderArticlePreview()}
					</IonContent>
				</IonPage>
			</IonContent>
		</IonModal>
	)
}
export default ModalParser;