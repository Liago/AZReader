import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useArticleParsed, insertPost, supabase } from "../store/rest";
import { personalScraper, rapidApiScraper } from "../common/scraper";
import { generateUniqueId, getScraperParmas } from "../utility/utils";
import { fetchPostsSuccess, setPagination, appendPosts, resetPosts } from "../store/actions";
import { Session } from "@supabase/supabase-js";
import { ArticleParsed, ArticleParseResponse, RootState, ScraperParams, UseLazyApiReturn } from "../common/interfaces";

interface ArticleParserReturn {
	parseArticle: (payload?: any) => Promise<void>;
	data: ArticleParsed | null;
	loading: boolean;
	error: null;
}

interface CustomPagination {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
}

interface ParserResponse {
	author: string;
	content: string;
	date_published: string | undefined;
	dek: null;
	direction: string;
	domain: string;
	excerpt: string;
	lead_image_url: string | undefined;
	next_page_url: null;
	word_count: number;
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

	const [parseArticle, { data: articleParsed, loading }] = useArticleParsed(searchText) as UseLazyApiReturn<ArticleParseResponse>;

	  useEffect(() => {
			const parseUrl = async () => {
				if (searchText === "") return;

				setIsParsing(true);
				setCustomArticleParsed(null);
				setRapidArticleParsed(null);

				try {
					const parserParams = getScraperParmas(searchText) as ScraperParams;

					if (!parserParams?.parser) {
						if (parseArticle && typeof parseArticle === "function") {
							await parseArticle();
						}
						return;
					}

					const handlePersonalScraper = async () => {
						const result = await personalScraper(searchText);
						if (Array.isArray(result) && result.length > 0) {
							setCustomArticleParsed(result[0] as ArticleParsed);
						}
					};

					const handleRapidApiScraper = async () => {
						const result = await rapidApiScraper(searchText);
						if (result) {
							setRapidArticleParsed(result as ArticleParsed);
						}
					};

					switch (parserParams.parser) {
						case "personal":
							await handlePersonalScraper();
							break;
						case "rapidApi":
							await handleRapidApiScraper();
							break;
						default:
							if (parseArticle && typeof parseArticle === "function") {
								await parseArticle();
							}
					}
				} catch (error) {
					console.error("Error parsing article:", error);
				} finally {
					setIsParsing(false);
				}
			};

			parseUrl();
		}, [searchText, parseArticle]);

	const savePostHandler = (): void => {
		// Implementation remains the same
	};

	const savePostToServer = async (): Promise<void> => {
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

			try {
				const response = await insertPost(enrichedArticle);
				if (response && typeof response === "object") {
					console.log(response);
				}
			} catch (error) {
				console.error("Failed to insert post:", error);
			}
		}

		setSearchText("");
		setShowModal(false);
		refresh();
	};

	const fetchPostsFromDb = useCallback(
		async (isInitialFetch = false): Promise<void> => {
			if (isLoading) return;
			setIsLoading(true);

			try {
				const currentPage = isRefreshing.current ? 1 : pagination.currentPage;
				const { itemsPerPage } = pagination;
				const from = (currentPage - 1) * itemsPerPage;
				const to = from + itemsPerPage - 1;

				const { data, count } = await supabase
					.from("posts")
					.select("*", { count: "exact" })
					.order("savedOn", { ascending: false, nullsFirst: false })
					.range(from, to);

				if (data) {
					const totalItems = count || 0;

					if (isInitialFetch || isRefreshing.current) {
						dispatch(fetchPostsSuccess(data, totalItems));
						dispatch(
							setPagination({
								currentPage: 1,
								itemsPerPage: 10,
								totalItems,
							})
						);
					} else {
						dispatch(appendPosts(data));
						dispatch(
							setPagination({
								...pagination,
								totalItems,
							})
						);
					}
				}
			} catch (error) {
				console.error("Failed to fetch posts:", error);
			} finally {
				setIsLoading(false);
				if (isRefreshing.current) {
					isRefreshing.current = false;
				}
			}
		},
		[dispatch, pagination, isLoading]
	);

	const refresh = useCallback(async (): Promise<void> => {
		if (isLoading) return;

		isRefreshing.current = true;
		dispatch(resetPosts());
		await fetchPostsFromDb(true);
	}, [dispatch, fetchPostsFromDb, isLoading]);

	const changePage = useCallback(
		(newPage: number): void => {
			if (isLoading || isRefreshing.current) return;
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
		if (pagination.currentPage > 1 && !isRefreshing.current) {
			fetchPostsFromDb(false);
		}
	}, [pagination.currentPage]);

	return {
		showModal,
		setShowModal,
		searchText,
		setSearchText,
		isParsing,
		articleParsed,
		savePostHandler,
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
