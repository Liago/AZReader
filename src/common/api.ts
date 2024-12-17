import { useEffect, useState } from "react";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { ApiResponse, UseLazyApiReturn } from "./interfaces";
import { supabaseDb, endpoint } from "../config/environment";

interface ApiOptions extends AxiosRequestConfig {
	useParserEndpoint?: boolean;
}

const wrappedApi = () => {
	const getBaseUrl = (useParserEndpoint?: boolean) => {
		return useParserEndpoint ? endpoint.parser : supabaseDb.SUPA_URL;
	};

	const useRawCall = async (
		method: AxiosRequestConfig["method"],
		url: string,
		payload: any = {},
		opts: ApiOptions = {}
	): Promise<ApiResponse<any>> => {
		let data: any = null;
		let error = null;
		const token = localStorage.getItem("temp_token") || null;
		const baseURL = getBaseUrl(opts.useParserEndpoint);

		try {
			const response = await axios({
				baseURL,
				headers: {
					...(opts.useParserEndpoint ? {} : { Authorization: `Bearer ${token}` }),
					"Content-Type": "application/json",
				},
				method: method || "GET",
				url,
				data: payload,
				...opts,
			});
			data = response.data;
		} catch (e) {
			error = e;
			data = {} as any;
		}
		return {
			data,
			error,
			loading: false,
		};
	};

	const useLazyApi = <T = any>(method: AxiosRequestConfig["method"], url: string, opts: ApiOptions = {}): UseLazyApiReturn<T> => {
		const [error, setError] = useState<any>(null);
		const [event, setEvent] = useState<{
			loading: boolean;
			data: T | null;
		}>({
			loading: false,
			data: null,
		});

		const token = localStorage.getItem("temp_token") || null;
		const baseURL = getBaseUrl(opts.useParserEndpoint);

		const func = async (payload: any = {}) => {
			try {
				setEvent({
					loading: true,
					data: null,
				});
				setError(null);

				const config: AxiosRequestConfig = {
					baseURL,
					headers: {
						...(opts.useParserEndpoint ? {} : { Authorization: `Bearer ${token}` }),
						"Content-Type": "application/json",
					},
					method: method || "GET",
					url,
					data: { ...payload, ...opts },
				};

				const response = await axios(config);
				setEvent({
					loading: false,
					data: response.data,
				});
			} catch (e) {
				setEvent({ loading: false, data: null });
				let errorMessage = "";
				const error = e as AxiosError;
				if (error.response) {
					console.error("Error in server response:", error.response.data);
					errorMessage = String(error.response.data);
				} else if (error.request) {
					console.error("No response received:", error.request);
					errorMessage = String(error.request);
				} else {
					console.error("Error during request setup:", error.message);
					errorMessage = error.message || "Unknown error occurred";
				}
				setError(errorMessage);
			}
		};

		return [
			func,
			{
				error,
				loading: event.loading,
				data: event.data as T | null,
			},
		];
	};

	const useApi = <T = any>(
		method: AxiosRequestConfig["method"],
		url: string = "",
		payload: any = {},
		opts: ApiOptions = {}
	): ApiResponse<T | null> => {
		const safeMethod = method || "GET";
		const [func, response] = useLazyApi<T>(safeMethod, url, opts);

		useEffect(() => {
			(async () => {
				await func(payload);
			})();
		}, []);

		return response;
	};

	return {
		useRawCall,
		useApi,
		useLazyApi,
	};
};

export { wrappedApi };
