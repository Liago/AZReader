import { scraperConfig } from '../config/scraperConfig';

import 'moment/locale/it'
import moment from "moment";
import { find, map, uniq } from 'lodash';

export const getDataFormatted = (date, dateFormat) => {
	return moment(date).format(dateFormat)
}
export const flattenServerTagList = (tagList) => {
	const onlyTags = map(tagList, "tags")
	const tagValues = onlyTags.reduce((acc, val) => acc.concat(val), []);
	return uniq(tagValues);
}

export const getScraperParmas = (searchText) => {
	const url = new URL(searchText);
	console.log('url.hostname', url.hostname)
	return find(scraperConfig, ["url", url.hostname])
}

export const isValidUrl = urlString => {
	var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
		'(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
	return !!urlPattern.test(urlString);
}

export const renderArticleDatePublished = date => {
	if (!date) return;

	// console.log('date', moment(date))

	return <>Pubblicato il {moment(date).format('DD MMMM YYYY')}</>;
}

export const manipulateDateFromString = $date => {
	var arr = $date.split(' ');
	const dateHash = {
		Gennaio: 1,
		Febbraio: 2,
		Marzo: 3,
		Aprile: 4,
		Maggio: 5,
		Giugno: 6,
		Luglio: 7,
		Agosto: 8,
		Settembre: 9,
		Ottonre: 10,
		Novembre: 11,
		Dicembre: 12
	};

	return dateHash[arr[1]] + '-' + arr[0] + '-' + arr[2];
}