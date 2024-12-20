import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Session } from "@supabase/auth-js/dist/module/lib/types";

import { ArticleParsed, RootState } from "@common/interfaces";

import { personalScraper, rapidApiScraper } from "@common/scraper";
import { generateUniqueId, getScraperParmas } from "@utility/utils";

import { fetchPostsSuccess, setPagination, appendPosts, resetPosts } from "@store/actions";
import { useArticleParsed, insertPost, supabase } from "@store/rest";

interface CustomPagination {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
}

interface UseArticlesReturn {
	showModal: boolean;
	setShowModal: (show: boolean) => void;
	searchText: string;
	setSearchText: (text: string) => void;
	isParsing: boolean;
	articleParsed: ArticleParsed | null;
	savePostHandler: () => void;
	savePostToServer: () => void;
	loading: boolean;
	postFromDb: ArticleParsed[];
	fetchPostsFromDb: (isInitialFetch?: boolean) => Promise<void>;
	changePage: (newPage: number) => void;
	pagination: CustomPagination;
	refresh: () => Promise<void>;
	isLoading: boolean;
}

const useArticles = (session: Session | null): UseArticlesReturn => {
	const dispatch = useDispatch();
	const { list: postFromDb, pagination = { currentPage: 1, itemsPerPage: 10, totalItems: 0 } } = useSelector((state: RootState) => state.posts);

	const [showModal, setShowModal] = useState<boolean>(false);
	const [searchText, setSearchText] = useState<string>("");
	const [customArticleParsed, setCustomArticleParsed] = useState<ArticleParsed | null>(null);
	const [rapidArticleParsed, setRapidArticleParsed] = useState<ArticleParsed | null>(null);
	const [isParsing, setIsParsing] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const isRefreshing = useRef(false);
	const parseInProgress = useRef(false);
	const isMounted = useRef(true);

	const [parseArticle, { data: articleParsed, loading }] = useArticleParsed(searchText);

	useEffect(() => {
		let isActive = true;

		const parseUrl = async () => {
			if (!searchText || parseInProgress.current || !isActive) return;

			parseInProgress.current = true;
			setIsParsing(true);

			try {
				const parserParams = getScraperParmas(searchText);
				if (!isActive) return;

				setCustomArticleParsed(null);
				setRapidArticleParsed(null);

				if (!parserParams?.parser) {
					await parseArticle();
					if (!isActive) return;
					return;
				}

				switch (parserParams.parser) {
					case "personal": {
						const result = await personalScraper(searchText);
						if (!isActive) return;
						if (Array.isArray(result) && result.length > 0) {
							setCustomArticleParsed(result[0] as ArticleParsed);
						}
						break;
					}
					case "rapidApi": {
						const result = await rapidApiScraper(searchText);
						if (!isActive) return;
						if (result) {
							setRapidArticleParsed(result as ArticleParsed);
						}
						break;
					}
					default:
						await parseArticle();
				}
			} catch (error) {
				if (!isActive) return;
				console.error("Error parsing article:", error);
				setCustomArticleParsed(null);
				setRapidArticleParsed(null);
			} finally {
				if (isActive) {
					setIsParsing(false);
					parseInProgress.current = false;
				}
			}
		};

		parseUrl();

		return () => {
			isActive = false;
			parseInProgress.current = false;
		};
	}, [searchText]); // Rimosso parseArticle dalle dipendenze

	const handleModalClose = useCallback(() => {
		if (!isMounted.current) return;
		setShowModal(false);
		setSearchText("");
		setCustomArticleParsed(null);
		setRapidArticleParsed(null);
		setIsParsing(false);
		parseInProgress.current = false;
	}, []);

	const fetchPostsFromDb = useCallback(
		async (isInitialFetch = false): Promise<void> => {
			if (isLoading || !isMounted.current) return;
			setIsLoading(true);

			try {
				const { currentPage, itemsPerPage } = pagination;
				const from = (currentPage - 1) * itemsPerPage;
				const to = from + itemsPerPage - 1;

				const { data, count } = await supabase
					.from("posts")
					.select("*", { count: "exact" })
					.order("savedOn", { ascending: false, nullsFirst: false })
					.range(from, to);

				if (!isMounted.current) return;

				if (data) {
					const totalItems = count || 0;

					if (isInitialFetch || isRefreshing.current) {
						dispatch(fetchPostsSuccess(data, totalItems));
						const newPagination = {
							currentPage: 1,
							itemsPerPage: 10,
							totalItems,
						};
						dispatch(setPagination(newPagination));
					} else {
						dispatch(appendPosts(data));
						dispatch(setPagination({ ...pagination, totalItems }));
					}
				}
			} catch (error) {
				console.error("Failed to fetch posts:", error);
			} finally {
				if (isMounted.current) {
					setIsLoading(false);
					if (isRefreshing.current) {
						isRefreshing.current = false;
					}
				}
			}
		},
		[dispatch, pagination, isLoading]
	);

	const refresh = useCallback(async (): Promise<void> => {
		if (isLoading || !isMounted.current) return;

		isRefreshing.current = true;
		dispatch(resetPosts());
		await fetchPostsFromDb(true);
	}, [dispatch, fetchPostsFromDb, isLoading]);

	const savePostToServer = useCallback(async (): Promise<void> => {
		if (!isMounted.current) return;

		try {
			if (rapidArticleParsed && rapidArticleParsed.url) {
				const url = new URL(rapidArticleParsed.url);
				rapidArticleParsed["domain"] = url.hostname;
			}

			const theArticleParsed = customArticleParsed || rapidArticleParsed || articleParsed;

			if (session?.user && theArticleParsed) {
				const enrichedArticle: ArticleParsed = {
					...theArticleParsed,
					readingList: [session.user.id],
					savedBy: {
						userId: session.user.id,
						userEmail: session.user.email || "",
					},
					savedOn: new Date().toISOString(),
					id: generateUniqueId(),
				};

				await insertPost(enrichedArticle);
			}

			handleModalClose();
			await refresh();
		} catch (error) {
			console.error("Failed to save post:", error);
		}
	}, [session, customArticleParsed, rapidArticleParsed, articleParsed, refresh, handleModalClose]);

	const changePage = useCallback(
		(newPage: number): void => {
			if (isLoading || isRefreshing.current || !isMounted.current) return;
			dispatch(
				setPagination({
					...pagination,
					currentPage: newPage,
				})
			);
		},
		[dispatch, pagination, isLoading]
	);

	useEffect(() => {
		if (!isRefreshing.current) {
			fetchPostsFromDb(true);
		}
	}, []);

	useEffect(() => {
		if (pagination.currentPage > 1 && !isRefreshing.current && isMounted.current) {
			fetchPostsFromDb(false);
		}
	}, [pagination.currentPage]);

	useEffect(() => {
		if (!showModal && isMounted.current) {
			handleModalClose();
		}
	}, [showModal, handleModalClose]);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	return {
		showModal,
		setShowModal,
		searchText,
		setSearchText,
		isParsing,
		articleParsed: customArticleParsed || rapidArticleParsed || articleParsed,
		savePostHandler: () => {}, // Implementazione non fornita
		savePostToServer,
		loading,
		postFromDb: postFromDb || [],
		fetchPostsFromDb,
		changePage,
		pagination,
		refresh,
		isLoading,
	};
};

export default useArticles;
