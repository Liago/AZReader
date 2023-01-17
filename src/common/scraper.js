import axios from 'axios';
import * as cheerio from 'cheerio';
import { forEach } from 'lodash';

import { getScraperParmas } from '../utility/utils';


export const personalScraper = (url) => {

	const scraperParams = getScraperParmas(url);

	return axios(`https://parser-373014.uc.r.appspot.com/${url}`)
		.then(response => {
			const html = response.data;
			const $ = cheerio.load(html);
			const article = [];
			let _content;
			let _lead_image_url;
			let _date_published;

			if (scraperParams.url === 'unaparolaalgiorno.it') {
				console.log('Esempio =>', {
					etimo: $('.word-etimo').text(),
					titolo: $(scraperParams.items.title).html(),
					contenutop: $(scraperParams.items.content).html().replaceAll('iframe', '')
				})
				// _lead_image_url = $(this).find('meta[property="og:image"]').attr('content')
			}



			const title = $(scraperParams.items.title).text();
			const author = $(scraperParams.items.author).text();	
			const dek = null;
			const direction = 'ltr';
			const domain = scraperParams.url;
			const excerpt = $(scraperParams.items.excerpt).text();
			if (scraperParams.url === 'www.lescienze.it') {
				console.log('scraperParams.items.lead_image', scraperParams.items.lead_image)
				_lead_image_url = $(scraperParams.items.lead_image).find('img').attr('data-src');
				_date_published = $(scraperParams.items.data_published).attr('datetime');
			} else {
				_lead_image_url = $(scraperParams.items.lead_image).find('img').attr('src');
				_date_published = $(scraperParams.items.data_published).text();
			}
			const date_published = _date_published;
			const lead_image_url = _lead_image_url;
			const next_page_url = null;
			const rendered_pages = 1;
			const total_pages = 1;
			
			if (scraperParams.isHTML) {
				_content = $(scraperParams.items.content).html().replaceAll('iframe', '');
			} else {
				_content = $(scraperParams.items.content).text().replaceAll('\n', '<div class="py-1">');
			}
			const jQuery = cheerio.load(_content);
			jQuery("img").each(function () {
				let data_source =$(this).attr('data-src');
				let source = $(this).attr('src');
				let text = $(this).attr('class');
				let html = $(this).html();
				console.log('immagine :>> ', {
					data_source: data_source,
					source: source,
					text: text,
					html: html
				});
				
				jQuery(this).html().replaceAll(source, data_source)

			});

			const content = _content;
			const word_count = _content.trim().split(/\s+/).length;
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
			})

			console.log('articole', article[0])
			return article;
		}).catch(err => console.log(err))
}

export const rapidApiScraper = (url) => {
	const options = {
		method: 'POST',
		url: 'https://news-article-data-extract-and-summarization1.p.rapidapi.com/extract/',
		headers: {
			'content-type': 'application/json',
			'X-RapidAPI-Key': '7a418749d3mshebd9060a7ab05b5p10c92djsnad5f8aae9234',
			'X-RapidAPI-Host': 'news-article-data-extract-and-summarization1.p.rapidapi.com'
		},
		data: `{"url":"${url}"}`
	};
	return promiseFunction(options)
}



const promiseFunction = (options) => {
	return new Promise((ok, ko) => {
		axios.request(options)
			.then(response => ok(response.data))
			.catch(error => ko(error));
	});
}