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
	return find(scraperConfig, ["url", url.hostname ]) 
}