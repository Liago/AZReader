import axios from 'axios';
import * as cheerio from 'cheerio';

import { getScraperParmas } from '../config/scraperConfig';


export const personalScraper = (url) => {

	const scraperParams = getScraperParmas(url);
	console.log('scraperParams', scraperParams)
	
	return axios(`https://parser-373014.uc.r.appspot.com/${url}`)
		.then(response => {
			const html = response.data
			const $ = cheerio.load(html)
			const article = []
			$(scraperParams.container, html).each(function () {
				console.log('$(this)', $(this))
				const title = $(this).find(scraperParams.items.title).text();
				const author = $(this).find(scraperParams.items.author).text();
				const content = $(this).find(scraperParams.items.content).text().replaceAll('\n', '<div class="py-2">');
				const date_published = $(this).find(scraperParams.items.data_published).text();
				const dek = null;
				const direction = 'ltr';
				const domain = scraperParams.url;
				const excerpt =  $(this).find(scraperParams.items.excerpt).text();
				const lead_image_url = $(this).find('picture').find('img').attr('src');
				const next_page_url = null;
				const rendered_pages = 1;
				const total_pages = 1;
				const word_count = content.trim().split(/\s+/).length;
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



