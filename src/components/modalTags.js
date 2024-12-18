import { useEffect, useState } from "react"
import { IonContent, IonModal, IonPage, IonSearchbar, IonToolbar, IonListHeader, IonButtons, IonButton } from "@ionic/react"

import { useTagsHandler } from "../store/rest";

import { filter, isEmpty } from 'lodash'
import { flattenServerTagList } from "../utility/utils";

const ModalTags = ({ showModal, dismissTagModalHandler, postId, clickme }) => {
	const [searchText, setSearchText] = useState('');
	const [tags, setTagList] = useState([]);
	const [articleTags, setArticleTags] = useState([]);
	const { data: tagList } = useTagsHandler();

	useEffect(() => {
		if (searchText === '') return;

		//search tag on server list
		console.log('tagList', tagList);
		const tagValues = flattenServerTagList(tagList);
		console.log('tagValues :>> ', tagValues);

		// let tagSearchedIndex = indexOf(tagValues, searchText, 0)
		// tagSearchedIndex <= 0 
		// 	? setTagList([...tags, searchText])
		// 	: setTagList([...tags, tagValues[tagSearchedIndex]])
	}, [searchText])

	useEffect(() => {
		if (!tagList) return;

		displayArticleTags(tagList)
	}, [tagList]);

	const tagClickHandler = () => {
		console.log('click')
	}

	const renderServerTags = () => {
		if (!tagList) return;

		const tagValues = flattenServerTagList(tagList);

		return tagValues.map(item => {
			return (
				<IonButton
					key={item}
					className="m-1 p-1 bg-blue-300 rounded-lg text-sm text-center text-neutral-50"
					// onClick={() => tagClickHandler()}
					onClick={() => console.log('click')}
				>
					<p>{item}</p>
				</IonButton>
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
		<>
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
						className="py-4 border-b-2"
					>
						Tags
					</IonListHeader>
					<div className="grid grid-cols-4 gap-1">
						{renderServerTags()}
					</div>
				</div>
			</IonContent>
		</>
	)
}
export default ModalTags;