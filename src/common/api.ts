import { useEffect, useState } from "react";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { CapacitorHttp } from "@capacitor/core";
import { ApiResponse, UseLazyApiReturn } from "./interfaces";
import { supabaseDb, endpoint } from "../config/environment";

interface ApiOptions extends AxiosRequestConfig {
	useParserEndpoint?: boolean;
	useCapacitorHttp?: boolean;
}

const wrappedApi = () => {
	const getBaseUrl = (useParserEndpoint?: boolean) => {
		return useParserEndpoint ? endpoint.parser : supabaseDb.SUPA_URL;
	};

	const getFullUrl = (baseURL: string, path: string, targetUrl?: string): string => {
		if (path.includes("parser") && targetUrl) {
			return `${baseURL}/parser?url=${encodeURIComponent(targetUrl)}`;
		}
		return `${baseURL}/${path}`;
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
			if (opts.useCapacitorHttp) {
				const fullUrl = getFullUrl(baseURL, url, payload?.url);
				console.log("🚀 ~ wrappedApi ~ fullUrl:", fullUrl)
				const response = await CapacitorHttp.request({
					method: method?.toUpperCase() || "GET",
					url: fullUrl,
					headers: {
						Accept: "application/json, text/plain, */*",
						origin: "ionic://localhost",
						"x-requested-with": "XMLHttpRequest",
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					...payload,
				});
				console.log("Capacitor HTTP response:", response);

				if (response.status >= 400) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				data = response.data;
			} else {
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
			}
		} catch (e) {
			console.error("API error:", e);
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

				if (opts.useCapacitorHttp) {
					const fullUrl = getFullUrl(baseURL, url, payload?.url);
					console.log("🚀 ~ func ~ fullUrl:", fullUrl)
					console.log("Using Capacitor HTTP in useLazyApi");
					const response = await CapacitorHttp.request({
						method: method?.toUpperCase() || "GET",
						url: fullUrl,
						headers: {
							Accept: "application/json, text/plain, */*",
							origin: "ionic://localhost",
							"x-requested-with": "XMLHttpRequest",
							...(token ? { Authorization: `Bearer ${token}` } : {}),
						},
						...payload,
					});

					console.log("Capacitor HTTP response:", response);

					if (response.status >= 400) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					setEvent({
						loading: false,
						data: response.data as T,
					});
				} else {
					const config: AxiosRequestConfig = {
						baseURL,
						headers: {
							...(opts.useParserEndpoint ? {} : { Authorization: `Bearer ${token}` }),
							"Content-Type": "application/json",
						},
						method: method || "GET",
						url,
						data: payload,
						...opts,
					};

					const response = await axios(config);
					setEvent({
						loading: false,
						data: response.data,
					});
				}
			} catch (error) {
				console.error("Full error details:", error);
				setEvent({ loading: false, data: null });
				let errorMessage = "";
				if (axios.isAxiosError(error)) {
					console.error("Axios error details:", {
						status: error.response?.status,
						data: error.response?.data,
						headers: error.response?.headers,
					});
					errorMessage = String(error.response?.data || error.message);
				} else {
					errorMessage = String(error);
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
