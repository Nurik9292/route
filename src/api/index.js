export { default as authAPI } from './authAPI';
export { default as routeAPI } from './routeAPI';
export { default as stopAPI } from './stopAPI';
export { default as adminAPI } from './adminAPI.js';
export { default as bannerAPI } from './bannerAPI';

import authAPI from './authAPI';
import routeAPI from './routeAPI';
import stopAPI from './stopAPI';
import adminAPI from './adminAPI';
import bannerAPI from './bannerAPI';

export const api = {
    auth: authAPI,
    routes: routeAPI,
    stops: stopAPI,
    admins: adminAPI,
    banners: bannerAPI
};


export const apiChecker = {

    async checkConnection() {
        try {
            await routeAPI.getActiveRoutes();
            return { status: 'connected', backend: true };

        } catch (error) {
            console.warn('Backend недоступен:', error);
            return {
                status: 'disconnected',
                backend: false,
                error: error.message
            };
        }
    },


    async checkAuthentication() {
        try {
            await authAPI.getCurrentUser();
            return { status: 'authenticated', auth: true };

        } catch (error) {
            return {
                status: 'unauthenticated',
                auth: false,
                error: error.message
            };
        }
    },

    async healthCheck() {
        const connection = await this.checkConnection();
        const auth = await this.checkAuthentication();

        return {
            timestamp: new Date().toISOString(),
            backend: connection.backend,
            authenticated: auth.auth,
            details: { connection, auth }
        };
    }
};



export const apiConfig = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
};