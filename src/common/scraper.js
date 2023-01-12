import axios from 'axios';
import * as cheerio from 'cheerio';

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
			$(scraperParams.container, html).each(function () {
				console.log('$(this)', $(this))
				const title = $(this).find(scraperParams.items.title).text();
				const author = $(this).find(scraperParams.items.author).text();
				if (scraperParams.isHTML) {
					_content = $(this).find(scraperParams.items.content).html().replaceAll('iframe', '');
				} else {
					_content = $(this).find(scraperParams.items.content).text().replaceAll('\n', '<div class="py-1">');
				}
				const content = _content;					
				const date_published = $(this).find(scraperParams.items.data_published).text();
				const dek = null;
				const direction = 'ltr';
				const domain = scraperParams.url;
				const excerpt =  $(this).find(scraperParams.items.excerpt).text();
				if (scraperParams.url === 'www.lescienze.it') {
					_lead_image_url = $(this).find(scraperParams.items.lead_image).find('img').attr('data-src');
				} else {
					_lead_image_url = $(this).find(scraperParams.items.lead_image).find('img').attr('src');
				}
				const lead_image_url = _lead_image_url;
				const next_page_url = null;
				const rendered_pages = 1;
				const total_pages = 1;
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
			})
			console.log('articole', article[0])
			return article;
		}).catch(err => console.log(err))
}


