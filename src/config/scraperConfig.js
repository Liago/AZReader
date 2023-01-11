import { find } from "lodash";

export const getScraperParmas = (searchText) => {
	const url = new URL(searchText);
	return find(scraperConfig, ["url", url.hostname ]) 
}


export const scraperConfig = [
	{
		"url": "www.lescienze.it",
		"container": "main",
		"items": {
			"title": "h1.detail_title",
			"author": ".detail_author",
			"content": "#detail-body",
			"data_published": ".detail_date",
			"excerpt": "¶detail-body-paywall"
		},
	},
	{
		"url": "unaparolaalgiorno.it",
		"container": "#layout-wrapper",
		"items": {
			"title": "h1",
			"author": "",
			"content": ".content"
		}
	}
]