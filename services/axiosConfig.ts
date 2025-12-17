import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { mockFetch } from './mockBackend';

// Create an Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: '', // Mock backend handles full URLs or relative
  timeout: 10000,
});

// Add an adapter to intercept requests and route them to mockFetch
// We use an adapter so that we can fully simulate the HTTP transport layer
apiClient.defaults.adapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    // Construct URL
    const baseURL = config.baseURL || '';
    const url = config.url ? (baseURL + config.url).replace('//', '/') : '';
    
    // Construct RequestInit for fetch
    const init: RequestInit = {
        method: config.method?.toUpperCase() || 'GET',
        headers: config.headers as Record<string, string>,
        body: config.data
    };

    try {
        // Call the mock backend
        const response = await mockFetch(url, init);
        
        // Convert Response to AxiosResponse
        const data = await response.json().catch(() => null); // Handle non-JSON responses if any
        
        return {
            data: data,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            config: config,
            request: {} // Mock request object
        };
    } catch (error) {
        // Handle network errors (simulated)
        return Promise.reject(error);
    }
};

export default apiClient;
