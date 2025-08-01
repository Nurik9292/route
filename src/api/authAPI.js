import {http} from '@/services';


class AuthAPI {
    async login(credentials) {
        return await http.post('/admin/auth/login', {
            username: credentials.username,
            password: credentials.password
        });
    }


    async logout() {
        return await http.post('/admin/auth/logout');
    }

    async refreshToken(refreshToken) {
        return await http.post('/admin/auth/refresh', {
            refreshToken: refreshToken
        });
    }

    async getCurrentAdmin() {
        return await http.get('/admin/auth/me');
    }

}

export default new AuthAPI();