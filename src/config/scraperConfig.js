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
			"excerpt": ".word-sillabe",
			"lead_image": ".newsletter-box",
			"data_published": ".word-datapub"
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
	 {
	 	"url": "www.eurosport.it",
	 	"container": "div.atom-template-sections",
			"isHTML": true,
			"parser": "personal",
			"items": {
				"title": "h1.text-onLight-02",
				"author": ".molecule-author-banner",
				"content": ".organism-article-main-content",
				//"lead_image": ".ugc--2nTu61bm.minor--3O_9dH4U"
			}
	 },
	 {
	 	"url": "www.tomshw.it",
	 	"container": "main",
	 	"isHTML": true,
	 	"parser": "personal",
	 	"items": {
	 		"title": "h1, .entry-title, .post-title, .article-title",
	 		"author": ".author, .byline, .post-author, .article-author",
	 		"content": ".entry-content, .post-content, .article-content, .content, main article",
	 		"excerpt": ".excerpt, .summary, .description",
	 		"lead_image": ".featured-image img, .post-image img, .article-image img, .wp-post-image",
	 		"data_published": "time, .date, .publish-date, .entry-date"
	 	}
	 }
]