import { useEffect, useState } from "react"
import { IonContent, IonItem, IonLabel, IonModal, IonPage, IonSearchbar, IonToolbar, IonListHeader } from "@ionic/react"

import { getTagsHandler } from "../store/rest";

import { filter, isEmpty } from 'lodash'

const ModalTags = ({ showModal, dismissTagModalHandler, postId }) => {
	const [searchText, setSearchText] = useState('');
	const [tags, setTagList] = useState([]);
	const [articleTags, setArticleTags] = useState([]);
	const { data: tagList } = getTagsHandler();

	useEffect(() => {
		if (searchText === '') return;

		setTagList([...tags, searchText])
	}, [searchText])

	useEffect(() => {
		if (!tagList) return;

		displayArticleTags(tagList)
	}, [tagList]);

	
	const renderServerTags = () => {
		if (!tagList) return;

		return Object.keys(tagList).map(key => {
			const { tags } = tagList[key];
			return (
				tags.map(item => {
					return (
						<div
							key={item}
							className="m-1 p-1 bg-blue-300 rounded-lg text-sm text-center text-neutral-50"
						>
							<p>{item}</p>
						</div>
					)
				})
			)
		})

	}
	const renderTags = () => {
		if (!tags) return;

		return (
			tags.map(item => {
				return (
					<div
						key={item}
						className="m-1 p-1 bg-red-500 rounded-lg text-sm text-center text-neutral-50"
					>
						{item}
					</div>
				)
			})
		)
	}

	const displayArticleTags = (tagList) => {
		let tagsRetrieved = filter(tagList, ['id', postId]);
		if (isEmpty(tagsRetrieved)) return;

		let tagArray = [];
		tagsRetrieved.map(item => {
			const { tags } = item;
			tagArray = [...tagArray, ...tags]
		})
		setArticleTags(tagArray);
	}



	const renderArticleTags = () => {
		if (!articleTags) return;

		return (
			<div className="flex justify-start">
				{articleTags.map(tag => {
					return (
						<div
							key={tag}
							className="m-1 p-1.5 bg-slate-200 rounded-lg">
							<p className="text-xs text-gray-700">{tag}</p>
						</div>
					)
				})}
			</div>
		)
	}


	return (
		<IonModal
			isOpen={showModal}
			breakpoints={[0.1, 0.5, 1]}
			initialBreakpoint={0.5}
			onDidDismiss={() => dismissTagModalHandler(tags)}
		>
			<IonContent>
				<IonPage>
					<IonToolbar>
						{renderArticleTags()}
					</IonToolbar>
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
						<div className="px-5">
							<div className="grid grid-cols-4 gap-1">
								{renderTags()}
							</div>
							<IonListHeader
								className="pt-4 border-b-2"
							>
								Tags
							</IonListHeader>
							<div className="grid grid-cols-4 gap-1">
								{renderServerTags()}
							</div>
						</div>
					</IonContent>
				</IonPage>
			</IonContent>
		</IonModal>
	)
}
export default ModalTags;