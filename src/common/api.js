import { useEffect, useState } from "react";
import axios from 'axios';
import { endpoint } from "../config/environment";

const wrappedApi = ({ store }) => {

	const UseRawCall = async (method, url, payload = {}, opts = {}) => {
		const token = store.getState()?.app.token || null;

		let data = null;
		let error = null;

		try {
			const response = await axios({
				baseURL: endpoint.db,
				headers: {
					'Content-Type': 'application/json'
				},
				method,
				url,
				data: JSON.stringify(payload)
			});

			data = response.data;
		} catch (e) {
			error = e;
		}

		return {
			data,
			error
		}
	}

	const UseApi = (method, url, payload = {}, opts = {}) => {
		const [func, response] = UseLazyApi(method, url);

		useEffect(() => {
			(async () => {
				await func(payload);
			})();
		}, []);

		return response;
	}
	const UseLazyApi = (method, url, opts = {}) => {
		const [error, setError] = useState(null);
		const [event, setEvent] = useState({
			loading: true,
			data: null
		});

		const token = store.getState()?.app?.token || null;

		const func = async (payload = {}) => {
			try {
				setEvent({
					loading: true,
					data: null
				});

				const response = await axios({
					baseURL: endpoint.parser,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + token
					},
					method,
					url,
					data: { ...payload, ...opts }
				});

				setEvent({
					loading: false,
					data: response.data
				});
			} catch (e) {
				setError(e);
			}
		}

		return [
			func,
			{
				error,
				loading: event.loading,
				data: event.data
			}
		];
	}

	const UseLazyServerApi = (method, url, opts = {}) => {
		const [error, setError] = useState(null);
		const [event, setEvent] = useState({
			loading: true,
			data: null
		});

		const token = store.getState()?.app?.tokenApp || null;

		const func = async (payload = {}) => {
			try {
				setEvent({
					loading: true,
					data: null
				});

				const response = await axios({
					baseURL: endpoint.api,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + token
					},
					method,
					url,
					data: { ...payload, ...opts }
				});

				setEvent({
					loading: false,
					data: response.data
				});
			} catch (e) {
				console.log('[LAZYAPI] :>> ', e);
				setError(e);
			}
		}

		return [
			func,
			{
				error,
				loading: event.loading,
				data: event.data
			}
		];
	}
	return {
		UseRawCall,
		UseApi,
		UseLazyApi,
		UseLazyServerApi
	}
}

export { wrappedApi };