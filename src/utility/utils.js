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
	try {
		// Verifica se l'input è una stringa
		if (typeof searchText !== 'string' || !searchText) {
			console.warn('Invalid input to getScraperParams:', searchText);
			return null;
		}

		// Decodifica l'URL se è codificato
		let decodedUrl = searchText;
		try {
			if (searchText.includes('%')) {
				decodedUrl = decodeURIComponent(searchText);
			}
		} catch (e) {
			console.warn('Error decoding URL:', e);
			// Se la decodifica fallisce, usiamo l'URL originale
		}

		// Assicurati che l'URL abbia un protocollo
		const urlToCheck = decodedUrl.startsWith('http') ? decodedUrl : `https://${decodedUrl}`;

		// Prova a creare un oggetto URL
		const url = new URL(urlToCheck);
		console.log('Parsing URL:', {
			input: searchText,
			processed: urlToCheck,
			hostname: url.hostname
		});

		// Cerca nella configurazione dello scraper
		const scraperParams = find(scraperConfig, ["url", url.hostname]);
		console.log('Found scraper config:', scraperParams);

		return scraperParams;
	} catch (error) {
		console.error('Error in getScraperParams:', {
			input: searchText,
			error: error.message
		});
		return null;
	}
}

export const isValidUrl = urlString => {
	if (typeof urlString !== 'string' || !urlString) {
		return false;
	}

	try {
		const processed = urlString.startsWith('http') ? urlString : `https://${urlString}`;
		new URL(processed);
		return true;
	} catch (err) {
		return false;
	}
}

export const renderArticleDatePublished = date => {
	if (!date) return;
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

export const generateUniqueId = (length = 20) => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const charactersLength = chars.length;
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}