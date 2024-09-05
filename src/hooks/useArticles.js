import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getArticledParsed, insertPost, supabase } from "../store/rest";
import { personalScraper, rapidApiScraper } from "../common/scraper";
import { generateUniqueId, getScraperParmas } from "../utility/utils";
import { fetchPostsSuccess, setPagination, appendPosts, resetPosts } from '../store/actions';

const useArticles = (session) => {
	const dispatch = useDispatch();
	const { list: postFromDb, pagination } = useSelector(state => state.posts);

	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [customArticleParsed, setCustomArticleParsed] = useState();
	const [rapidArticleParsed, setRapidArticleParsed] = useState();
	const [isParsing, setIsParsing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

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
		// if (rapidArticleParsed) {
		// 	const url = new URL(rapidArticleParsed.url);
		// 	rapidArticleParsed['domain'] = url.hostname;
		// }
		// const theArticleParsed = customArticleParsed ? customArticleParsed : rapidArticleParsed ?? articleParsed;

		// dispatch(savePost(theArticleParsed));
		// setSearchText('');
		// setShowModal(false);
	};

	const savePostToServer = () => {
		console.log('savePostToServer');
		if (rapidArticleParsed) {
			const url = new URL(rapidArticleParsed.url);
			rapidArticleParsed['domain'] = url.hostname;
		}
		const theArticleParsed = customArticleParsed ? customArticleParsed : rapidArticleParsed ?? articleParsed;
		if (session?.user) {
			theArticleParsed['readingList'] = [session.user.id];
			theArticleParsed['savedBy'] = { userId: session.user.id, userEmail: session.user.email };
			theArticleParsed['savedOn'] = new Date().toISOString();
			theArticleParsed['id'] = generateUniqueId();
			insertPost(theArticleParsed)
				.then(response => console.log(response.json()))
		}
		setSearchText('');
		setShowModal(false);
		fetchPostsFromDb(true);
	};

	const fetchPostsFromDb = useCallback(async (isInitialFetch = false) => {
		if (isLoading) return;
		setIsLoading(true);
		try {
			const { currentPage, itemsPerPage } = pagination;
			const from = (currentPage - 1) * itemsPerPage;
			const to = from + itemsPerPage - 1;

			const { data, count } = await supabase
				.from("posts")
				.select('*', { count: 'exact' })
				.order("savedOn", { ascending: false, nullsLast: true })
				.range(from, to);

			if (data) {
				if (isInitialFetch) {
					dispatch(fetchPostsSuccess(data, count));
				} else {
					dispatch(appendPosts(data));
				}
				dispatch(setPagination({ ...pagination, totalItems: count }));
			}
		} catch (error) {
			console.error('Failed to fetch posts:', error);
		} finally {
			setIsLoading(false);
		}
	}, [dispatch, pagination, isLoading]);

	const refresh = useCallback(async () => {
		if (isLoading) return;
		dispatch(resetPosts());
		dispatch(setPagination({ currentPage: 1, itemsPerPage: 10, totalItems: 0 }));
		await fetchPostsFromDb(true);
	}, [dispatch, fetchPostsFromDb, isLoading]);

	const changePage = useCallback((newPage) => {
		if (isLoading) return;
		dispatch(setPagination({ ...pagination, currentPage: newPage }));
	}, [dispatch, pagination, isLoading]);

	useEffect(() => {
		fetchPostsFromDb(true);
	}, []);

	useEffect(() => {
		if (pagination.currentPage > 1) {
			fetchPostsFromDb(false);
		}
	}, [pagination.currentPage]);

	return {
		showModal, setShowModal,
		searchText, setSearchText,
		isParsing, articleParsed,
		savePostHandler, savePostToServer,
		loading, postFromDb, fetchPostsFromDb,
		changePage, pagination, refresh
	};
};

export default useArticles;