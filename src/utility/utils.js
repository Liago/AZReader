import 'moment/locale/it'
import moment from "moment";
import { map, uniq } from 'lodash';

export const getDataFormatted = (date, dateFormat) => {
	return moment(date).format(dateFormat)
}
export const flattenServerTagList = (tagList) => {
	const onlyTags = map(tagList, "tags")
	const tagValues = onlyTags.reduce((acc, val) => acc.concat(val), []);
	return uniq(tagValues);
}

export const millisToMinutesAndSeconds = (millis) => {
	var minutes = Math.floor(millis / 60000);
	var seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}