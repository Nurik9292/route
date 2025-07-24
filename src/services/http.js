import Axios from 'axios';
import NProgress from 'nprogress';
import { eventBus } from '@/utils';
import { authService } from '@/services';

class Http {
    constructor() {
        this.client = Axios.create({
            baseURL: `${import.meta.env.VITE_API_URL}`,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        this.silent = false;

        this.client.interceptors.request.use((config) => {
            if (!this.silent) this.showLoadingIndicator();            
            config.headers.Authorization = `Bearer ${authService.getApiToken()}`;  
            return config;
        });
      
    
        this.client.interceptors.response.use((response) => {
           
            if (!this.silent) this.hideLoadingIndicator();
            this.silent = false;

            const token = response.headers.authorization;
            if (token) authService.setApiToken(token);

            return response;
        }, (error) => {
            if (!this.silent) this.hideLoadingIndicator();
            this.silent = false;

            if (error.response?.status === 400 || error.response?.status === 401) {
                if (!(error.config.method === 'post' && error.config.url === 'me')) {
                    eventBus.emit('LOG_OUT');
                }
            }

            return Promise.reject(error);
        });
    }

    get silently() {
        this.silent = true;
        return this;
    }

    async request(method, url, data = {}, onUploadProgress) {
        return this.client.request({
            url,
            data,
            method,
            onUploadProgress
        }).then(response => response.data);
    }

    async get(url) {
        return await this.request('get', url);
    }

    async post(url, data = {}, onUploadProgress) {
        return (await this.request('post', url, data, onUploadProgress));
    }

    async put(url, data) {
        return (await this.request('put', url, data));
    }

    async patch(url, data) {
        return (await this.request('patch', url, data));
    }

    async delete(url, data = {}) {
        return (await this.request('delete', url, data));
    }

    showLoadingIndicator() {
        NProgress.start();
    }

    hideLoadingIndicator() {
        NProgress.done(true);
    }
}

export const http = new Http();
