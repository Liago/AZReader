import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonPage, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react"
import { close, saveOutline, shareSocial } from "ionicons/icons";

import Spinner from './ui/spinner';
import Article from "./article";

import { isValidUrl } from "../utility/utils";

import { isNil } from 'lodash';


const ModalParser = ({ articleParsed, showModal, pageRef, savePostHandler, setShowModal, searchText, setSearchText, savePostToServer, loading }) => {
	const onDismissHandler = () => {
		setSearchText('');
	}

	const dismissModalHandler = () => {
		setSearchText('');
		setShowModal(false);
	}

	const renderArticlePreview = () => {
		if (!articleParsed || !searchText) return;

		return <Article
			articleParsed={articleParsed}
			onDismiss={onDismissHandler}
			displayFrom="modalPreview"
		/>
	}

	const renderSpinner = () => {
		if ((loading && searchText === '') || articleParsed) return;

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
									disabled={isNil(articleParsed) || searchText === ''}
									color='dark'
									onClick={savePostHandler}
								>
									<IonIcon slot='icon-only' icon={saveOutline} />
								</IonButton>
								<IonButton
									disabled={isNil(articleParsed) || searchText === ''}
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