
import { useEffect, useState } from "react";
import { endpoint } from "../config/environment";
import { Http } from '@capacitor-community/http';
import { isNil } from 'lodash';

const useFetch = (url) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (isNil(url)) return;

		setLoading('loading...')
		setData(null);
		setError(null);

		const request = async () => {
			const response = await Http.request({
				method: 'GET',
				url: `${endpoint.parser}/parser?url=${url}`,
				headers: {
					'Content-Type': 'application/json',
					'sticazzi': 'altissimi'
				},
			});
			setData(response.data);
			setLoading(false);
		};

		request();

	}, [url])

	return { data, loading, error }
}
export { useFetch };
