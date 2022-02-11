import { useEffect, useState } from "react"
import { IonButton, IonButtons, IonContent, IonItem, IonLabel, IonList, IonModal, IonPage, IonSearchbar, IonToolbar } from "@ionic/react"

import { getTagsHandler } from "../store/rest";

import { isObject } from 'lodash'

const ModalTags = ({ showModal, dismissTagModalHandler }) => {
	const [searchText, setSearchText] = useState('');
	const [tags, setTagList] = useState([]);
	const { data: tagList, loading, error } = getTagsHandler();

	const renderServerTags = () => {
		if (!tagList) return;


		console.log('tagList', tagList)

		return Object.keys(tagList).map(key => {
			const { tags } = tagList[key];
			return (
				tags.map(item => {
					return (
						<IonItem lines='none' key={item}>
							<IonLabel>{item}</IonLabel>
						</IonItem>
					)
				})
			)
		})

	}
	const renderTags = () => {
		if (!tags) return;


		console.log('tagsContent', tags)

		return (
			tags.map(item => {
				return (
					<IonItem lines='none' key={item}>
						<IonLabel>{item}</IonLabel>
					</IonItem>
				)
			})
		)
	}


	useEffect(() => {
		if (searchText === '') return;

		setTagList([...tags, searchText])

	}, [searchText])

	useEffect(() => {
		if (!tagList) return;

		console.log('tagList :>> ', tagList);
	}, [])

	return (
		<IonModal
			isOpen={showModal}
			breakpoints={[0.1, 0.5, 1]}
			initialBreakpoint={0.5}
			onDidDismiss={() => dismissTagModalHandler(tags)}
		>
			<IonContent>
				<IonPage>
					<IonContent fullscreen>
						<IonSearchbar
							animated
							className="py-10"
							value={searchText}
							placeholder="cerca un tag o inseriscine uno nuovo"
							debounce={1000}
							onIonChange={(e) => setSearchText(e.detail.value)}
						>
						</IonSearchbar>
						<IonList>
							{renderTags()}
							{renderServerTags()}
						</IonList>
					</IonContent>
				</IonPage>
			</IonContent>
		</IonModal>
	)
}
export default ModalTags;