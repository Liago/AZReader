import { useState, useEffect } from 'react';
import { useDispatch } from "react-redux";

import { savePost } from "../store/actions";
import { getArticledParsed, supabase } from "../store/rest";
import { personalScraper, rapidApiScraper } from "../common/scraper";

import { getScraperParmas } from "../utility/utils";
import { savePostToFirestore } from '../common/firestore';

const useArticles = (session) => {
	const dispatch = useDispatch();
	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [customArticleParsed, setCustomArticleParsed] = useState();
	const [rapidArticleParsed, setRapidArticleParsed] = useState();
	const [isParsing, setIsParsing] = useState(false);
	const [postFromDb, setPostFromDb] = useState([]);

	const [parseArticle, { data: articleParsed, loading }] = getArticledParsed(searchText);

	useEffect(() => {
		if (searchText === '') return;
		setIsParsing(true);
		setCustomArticleParsed(null);
		setRapidArticleParsed(null);

		const parserParams = getScraperParmas(searchText);

		if (!parserParams?.parser) {
			parseArticle();
			setIsParsing(false);
			return;
		}
		switch (parserParams.parser) {
			case 'personal':
				personalScraper(searchText).then(resp => setCustomArticleParsed(resp[0]));
				break;
			case 'rapidApi':
				rapidApiScraper(searchText).then(resp => setRapidArticleParsed(resp));
				break;
			default:
				parseArticle();
		}

		setIsParsing(false);
	}, [searchText]);

	const savePostHandler = () => {
		if (rapidArticleParsed) {
			const url = new URL(rapidArticleParsed.url);
			rapidArticleParsed['domain'] = url.hostname;
		}
		const theArticleParsed = customArticleParsed ? customArticleParsed : rapidArticleParsed ?? articleParsed;

		dispatch(savePost(theArticleParsed));
		setSearchText('');
		setShowModal(false);
	};

	const savePostToServer = () => {
		if (rapidArticleParsed) {
			const url = new URL(rapidArticleParsed.url);
			rapidArticleParsed['domain'] = url.hostname;
		}
		const theArticleParsed = customArticleParsed ? customArticleParsed : rapidArticleParsed ?? articleParsed;

		if (session?.user) {
			theArticleParsed['readingList'] = [session.user.id];
			theArticleParsed['savedBy'] = { userId: session.user.id, userEmail: session.user.email };
			theArticleParsed['savedOn'] = Date.now();

			savePostToFirestore(theArticleParsed)
				.then(response => {
					console.log('response :>> ', response);
				})
				.catch(err => {
					console.log('err :>> ', err);
				});
		}

		setSearchText('');
		setShowModal(false);
		setTimeout(() => {
			fetchPostsFromDb();
		}, 500);
	};

	const fetchPostsFromDb = async () => {
		setPostFromDb([]);
		const { data } = await supabase
			.from("posts")
			.select('*')
			//.eq('domain', 'www.ilpost.it')
			.order("savedOn", { ascending: false });

		console.log("🚀 ~ fetchPostsFromDb ~ data:", data)

		if (data) {
			setPostFromDb(data);
		}
	};

	return {
		showModal, setShowModal,
		searchText, setSearchText,
		isParsing, articleParsed,
		savePostHandler, savePostToServer,
		loading, postFromDb, fetchPostsFromDb
	};
};

export default useArticles;