import { useEffect, useState } from "react";
import { IonContent, IonSearchbar, IonToolbar, IonListHeader, IonButton } from "@ionic/react";
import { useTagsHandler } from "@store/rest";
import { filter, isEmpty } from "lodash";
import { flattenServerTagList } from "../utility/utils";
import { TagItem, TagsResponse } from "@common/interfaces";

interface ModalTagsProps {
	showModal: boolean;
	dismissTagModalHandler: (tagsSelected: string[]) => Promise<void>;
	postId: string;
	clickme?: () => void;
}

const ModalTags: React.FC<ModalTagsProps> = ({ showModal, dismissTagModalHandler, postId, clickme }) => {
	const [searchText, setSearchText] = useState<string>("");
	const [tags, setTagList] = useState<string[]>([]);
	const [articleTags, setArticleTags] = useState<string[]>([]);

	const { data: tagList, loading, error } = useTagsHandler();

	useEffect(() => {
		if (searchText === "") return;
		if (!tagList) return;

		const tagValues = flattenServerTagList(tagList);
		console.log("Available tags:", tagValues);

		if (!tags.includes(searchText) && searchText.trim()) {
			setTagList((prevTags) => [...prevTags, searchText]);
		}
	}, [searchText, tagList, tags]);

	useEffect(() => {
		if (!tagList) return;
		displayArticleTags(tagList);
	}, [tagList, postId]);

	const tagClickHandler = (tag: string) => {
		if (clickme) {
			clickme();
		}
		if (!tags.includes(tag)) {
			setTagList((prevTags) => [...prevTags, tag]);
		}
	};

	const renderServerTags = () => {
		if (!tagList || loading) return null;
		if (error) return <div>Error loading tags</div>;

		const tagValues = flattenServerTagList(tagList);
		return tagValues.map((item: string) => (
			<IonButton
				key={item}
				className="m-1 p-1 bg-blue-300 rounded-lg text-sm text-center text-neutral-50"
				onClick={() => tagClickHandler(item)}
			>
				<p>{item}</p>
			</IonButton>
		));
	};

	const renderTags = () => {
		if (!tags.length) return null;

		return tags.map((item: string) => (
			<div
				key={item}
				className="m-1 p-1 bg-red-500 rounded-lg text-sm text-center text-neutral-50"
				onClick={() => {
					// Rimuovi il tag dalla lista quando viene cliccato
					setTagList((prevTags) => prevTags.filter((tag) => tag !== item));
				}}
			>
				{item}
			</div>
		));
	};

	const displayArticleTags = (tagList: TagItem[]) => {
		const tagsRetrieved = filter(tagList, ["id", postId]);
		if (isEmpty(tagsRetrieved)) return;

		const tagArray = tagsRetrieved.reduce((acc: string[], item: TagItem) => {
			return [...acc, ...item.tags];
		}, []);

		setArticleTags(tagArray);
	};

	const renderArticleTags = () => {
		if (!articleTags.length) return null;

		return (
			<div className="flex justify-start">
				{articleTags.map((tag: string) => (
					<div key={tag} className="m-1 p-1.5 bg-slate-200 rounded-lg">
						<p className="text-xs text-gray-700">{tag}</p>
					</div>
				))}
			</div>
		);
	};

	const handleSave = () => {
		if (tags.length) {
			dismissTagModalHandler(tags);
		}
	};

	return (
		<>
			<IonToolbar>{renderArticleTags()}</IonToolbar>
			<IonContent fullscreen>
				<IonSearchbar
					animated
					className="py-10"
					value={searchText}
					placeholder="cerca un tag o inseriscine uno nuovo"
					debounce={1000}
					onIonChange={(e) => setSearchText(e.detail.value || "")}
					disabled={loading}
				/>
				<div className="px-5">
					<div className="grid grid-cols-4 gap-1">{renderTags()}</div>
					<IonListHeader className="py-4 border-b-2">
						Tags
						{loading && <span className="text-sm text-gray-500 ml-2">Loading...</span>}
					</IonListHeader>
					<div className="grid grid-cols-4 gap-1">{renderServerTags()}</div>
				</div>

				<div className="px-5 py-4">
					<IonButton expand="block" onClick={() => dismissTagModalHandler(tags)} disabled={!tags.length || loading}>
						Salva Tags
					</IonButton>
				</div>
			</IonContent>
		</>
	);
};

export default ModalTags;
