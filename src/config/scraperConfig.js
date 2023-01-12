export const scraperConfig = [
	{
		"url": "www.lescienze.it",
		"container": "main",
		"isHTML": false,
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
		"isHTML": true,
		"items": {
			"title": "h1",
			"author": "",
			"content": "article",
			"lead_image": "newsletter-box"
		}
	},
	{
		"url": "comedonchisciotte.org",
		"container": ".single-container",
		"isHTML": false,
		"items": {
			"title": ".post-title",
			"author": ".post-author-name",
			"content": "entry-content",
			"lead_image": "img.b-loaded"
		}
	},
	{
		"url": "appleinsider.com",
		"container": "article.reviews",
		"isHTML": true,
		"items": {
			"title": "h1.h1-adjust",
			"author": ".avatar-link",
			"content": ".row",
			"lead_image": "#article-hero"
		}
	},
]