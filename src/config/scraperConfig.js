export const scraperConfig = [
	{
		"url": "www.lescienze.it",
		"container": "main",
		"isHTML": true,
		"parser": "personal",
		"items": {
			"title": "h1.detail_title",
			"author": ".detail_author",
			"content": "#detail-body",
			"data_published": ".detail_date",
			"excerpt": "¶detail-body-paywall",
			"lead_image": ".inline-article_media"
		},
	},
	{
		"url": "unaparolaalgiorno.it",
		"container": "#layout-wrapper",
		"isHTML": true,
		"parser": "personal",
		"items": {
			"title": "h1",
			"author": "",
			"content": "article",
			"lead_image": "newsletter-box",
		}
	},
	{
		"url": "www.macrumors.com",
		"container": "#maincontent",
		"isHTML": true,
		"parser": "personal",
		"items": {
			"title": ".heading--1cooZo6n.heading--h5--3l5xQ3lN.heading--white--2vAPsAl1.heading--noMargin--mnRHPAnD",
			"author": ".authorLink--3Zlx7Owv",
			"content": ".js-content",
			"lead_image": ".ugc--2nTu61bm.minor--3O_9dH4U"
		}
	},
	{
		"url": "appleinsider.com",
		"container": "article.reviews",
		"isHTML": true,
		"parser": "personal",
		"items": {
			"title": "h1.h1-adjust",
			"author": ".avatar-link",
			"content": ".row",
			"lead_image": "#article-hero > a"
		}
	},
	{
		"url": "www.ghosthuntersroma.it",
		"parser": "rapidApi",
	},
	{
		"url": "sport.sky.it",
		"parser": "rapidApi",
	},
	{
		"url": "it.wikipedia.org",
		"parser": "rapidApi",
	},
	{
		"url": "www.engadget.com",
		"parser": "rapidApi",
	},
]