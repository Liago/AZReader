import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import type { Element as CheerioElement } from 'domhandler';
import { getScraperParmas, manipulateDateFromString } from '../utility/utils';
import moment from 'moment';
import { endpoint } from '@config/environment';

// Interfacce
interface ScraperItem {
	title: string;
	author: string;
	excerpt: string;
	lead_image: string;
	data_published: string;
	content: string;
}

interface ScraperParams {
	url: string;
	items: ScraperItem;
	isHTML: boolean;
}

interface ArticleData {
	author: string;
	content: string;
	date_published: string;
	dek: string | null;
	direction: string;
	domain: string;
	excerpt: string;
	lead_image_url: string | null;
	next_page_url: string | null;
	rendered_pages: number;
	title: string;
	total_pages: number;
	url: string;
	word_count: number;
}

export const personalScraper = (url: string): Promise<ArticleData[] | undefined> => {
	const scraperParamsResult = getScraperParmas(url);
	
	if (!scraperParamsResult) {
		return Promise.resolve(undefined);
	}
	
	const scraperParams: ScraperParams = scraperParamsResult as ScraperParams;

	return axios(`https://parser-373014.uc.r.appspot.com/${url}`)
		.then((response: AxiosResponse) => {
			const html: string = response.data;
			const $: CheerioAPI = cheerio.load(html);
			const article: ArticleData[] = [];
			let _content: string;
			let _lead_image_url: string | null = null;
			let _date_published: string;

			const title: string = $(scraperParams.items.title).text();
			const author: string = $(scraperParams.items.author).text();
			const dek: null = null;
			const direction: string = 'ltr';
			const domain: string = scraperParams.url;
			const excerpt: string = $(scraperParams.items.excerpt).text();

			switch (scraperParams.url) {
				case 'www.lescienze.it':
					_lead_image_url = $(scraperParams.items.lead_image).find('img').attr('data-src') || null;
					_date_published = $(scraperParams.items.data_published).attr('datetime') || '';
					break;
				case 'unaparolaalgiorno.it':
					_lead_image_url = $("meta[property='og:image']").attr("content") || null;
					const $data: string = $('.word-datapub').text().replace('Parola pubblicata il', '').trim();
					const temp: string = manipulateDateFromString($data);
					_date_published = moment(temp, 'MM-DD-YYYY').toISOString().toString();
					break;
				default:
					_lead_image_url = $(scraperParams.items.lead_image).find('img').attr('src') || null;
					_date_published = $(scraperParams.items.data_published).text();
					break;
			}

			const date_published: string = _date_published;
			const lead_image_url: string | null = _lead_image_url;
			const next_page_url: null = null;
			const rendered_pages: number = 1;
			const total_pages: number = 1;

			if (scraperParams.isHTML) {
				_content = $(scraperParams.items.content).html()?.replaceAll('iframe', '') || '';
			} else {
				_content = $(scraperParams.items.content).text().replaceAll('\n', '<div class="py-1">');
			}

			const jQuery: CheerioAPI = cheerio.load(_content);
			jQuery("img").each(function() {
				const data_source: string | undefined = jQuery(this).attr('data-src');
				jQuery(this).attr("src", data_source || '');
			});

			const content: string = jQuery.html();
			const word_count: number = content.trim().split(/\s+/).length;

			article.push({
				author,
				content,
				date_published,
				dek,
				direction,
				domain,
				excerpt,
				lead_image_url,
				next_page_url,
				rendered_pages,
				title,
				total_pages,
				url,
				word_count
			});

			return article;
		})
		.catch((err: Error) => {
			console.log(err);
			return undefined;
		});
};

interface RapidApiResponse {
	// Definire la struttura della risposta dell'API
	[key: string]: any;
}

export const rapidApiScraper = (url: string): Promise<RapidApiResponse> => {
	const options: AxiosRequestConfig = {
		method: 'POST',
		url: 'https://news-article-data-extract-and-summarization1.p.rapidapi.com/extract/',
		headers: {
			'content-type': 'application/json',
			'X-RapidAPI-Key': endpoint.RAPID_API_KEY,
			'X-RapidAPI-Host': 'news-article-data-extract-and-summarization1.p.rapidapi.com'
		},
		data: `{"url":"${url}"}`
	};

	return promiseFunction(options);
};

const promiseFunction = <T>(options: AxiosRequestConfig): Promise<T> => {
	return new Promise<T>((ok, ko) => {
		axios.request<T>(options)
			.then(response => ok(response.data))
			.catch(error => ko(error));
	});
}; 