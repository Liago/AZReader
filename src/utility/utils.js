import 'moment/locale/it'
import moment from "moment";

export const getDataFormatted = (date, dateFormat) => {
	return moment(date).format(dateFormat)
}

