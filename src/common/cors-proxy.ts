import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { endpoint } from '@config/environment';

/**
 * CORS Proxy service for handling cross-origin requests
 */
export interface CorsProxyConfig {
	timeout?: number;
	retries?: number;
	headers?: Record<string, string>;
}

export class CorsProxyService {
	private proxyUrl: string;
	private defaultConfig: CorsProxyConfig;

	constructor(proxyUrl = endpoint.corsProxy) {
		this.proxyUrl = proxyUrl;
		this.defaultConfig = {
			timeout: 15000,
			retries: 2,
			headers: {
				'Accept': 'application/json, text/html, */*',
				'User-Agent': 'AZReader/1.17.0 (CORS Proxy)',
			},
		};
	}

	/**
	 * Make a proxied request through the CORS proxy
	 */
	async request<T = any>(
		targetUrl: string,
		config: CorsProxyConfig = {}
	): Promise<AxiosResponse<T>> {
		const mergedConfig = { ...this.defaultConfig, ...config };
		
		// Construct proxy URL
		const proxyRequestUrl = `${this.proxyUrl}/${targetUrl}`;
		
		const axiosConfig: AxiosRequestConfig = {
			url: proxyRequestUrl,
			method: 'GET',
			timeout: mergedConfig.timeout,
			headers: {
				...mergedConfig.headers,
				// Add CORS headers
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
			},
			// Handle mobile environments
			adapter: this.getAdapter(),
		};

		let lastError: any;
		const maxRetries = mergedConfig.retries || 0;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const response = await axios.request<T>(axiosConfig);
				
				// Log successful requests in development
				if (endpoint.test_mode) {
					console.log(`CORS Proxy request successful (attempt ${attempt + 1}):`, {
						targetUrl,
						proxyUrl: proxyRequestUrl,
						status: response.status,
						responseSize: JSON.stringify(response.data).length,
					});
				}

				return response;
			} catch (error) {
				lastError = error;
				
				// Log retry attempts
				if (attempt < maxRetries) {
					console.warn(`CORS Proxy request failed (attempt ${attempt + 1}), retrying...`, {
						targetUrl,
						error: axios.isAxiosError(error) ? error.message : String(error),
					});
					
					// Wait before retry with exponential backoff
					await this.sleep(Math.pow(2, attempt) * 1000);
				}
			}
		}

		// If all attempts failed, throw the last error
		throw lastError;
	}

	/**
	 * Check if proxy is available
	 */
	async isProxyAvailable(): Promise<boolean> {
		try {
			const response = await axios.get(this.proxyUrl, {
				timeout: 5000,
				headers: {
					'Accept': 'text/html, application/json',
				},
			});
			
			return response.status >= 200 && response.status < 400;
		} catch (error) {
			console.warn('CORS Proxy unavailable:', error);
			return false;
		}
	}

	/**
	 * Get appropriate adapter based on environment
	 */
	private getAdapter(): any {
		// In Capacitor/Cordova environments, use default adapter
		// This helps with mobile CORS issues
		if (window && (window as any).Capacitor) {
			return undefined; // Use default adapter
		}

		return undefined;
	}

	/**
	 * Sleep utility for retry delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Extract text content from proxied response
	 */
	extractTextContent(response: AxiosResponse): string {
		if (typeof response.data === 'string') {
			return response.data;
		}
		
		if (response.data && typeof response.data === 'object') {
			// If the response is JSON, try to extract HTML content
			if (response.data.html) {
				return response.data.html;
			}
			if (response.data.content) {
				return response.data.content;
			}
		}

		return String(response.data || '');
	}

	/**
	 * Handle different response content types
	 */
	processResponse<T>(response: AxiosResponse): T {
		const contentType = response.headers['content-type'] || '';

		if (contentType.includes('application/json')) {
			return response.data;
		}

		if (contentType.includes('text/html')) {
			// For HTML responses, wrap in a consistent structure
			return {
				html: response.data,
				url: response.config?.url,
				status: response.status,
			} as T;
		}

		// Default: return as-is
		return response.data;
	}
}

// Create singleton instance
const corsProxy = new CorsProxyService();

// Convenience functions
export const proxiedRequest = <T = any>(
	url: string,
	config?: CorsProxyConfig
): Promise<AxiosResponse<T>> => {
	return corsProxy.request<T>(url, config);
};

export const isProxyAvailable = (): Promise<boolean> => {
	return corsProxy.isProxyAvailable();
};

export { corsProxy };
export default corsProxy;