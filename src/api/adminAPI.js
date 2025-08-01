import {http} from '@/services';

class AdminAPI {


    async activate(id) {
        return await http.post(`/admin/users/${id}/activate`);
    }

    async deactivate(id) {
        return await http.post(`/admin/users/${id}/deactivate`);
    }

    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/admin/users?${queryString}` : '/admin/users';
        return await http.get(url);
    }

    async getById(id) {
        return await http.get(`/admin/users/${id}`);
    }

    async store(data) {
        const payload = {
            username: data.username,
            password: data.password,
            fullName: data.fullName || data.name,
            isSuperAdmin: data.isSuperAdmin || data.isAdmin || false,
            isActive: data.isActive !== false
        };

        return await http.post('/admin/users', payload);
    }

    async update(id, data) {
        const payload = {
            username: data.username,
            fullName: data.fullName || data.name,
            isSuperAdmin: data.isSuperAdmin || data.isAdmin,
            isActive: data.isActive
        };

        if (data.password && data.password.trim()) {
            payload.password = data.password;
        }

        return await http.put(`/admin/users/${id}`, payload);
    }

    async delete(id) {
        return await http.delete(`/admin/users/${id}`);
    }

    async changePassword(id, oldPassword, newPassword) {
        const payload = {
            oldPassword: oldPassword,
            newPassword: newPassword
        };

        return await http.patch(`/admin/users/${id}/password`, payload);
    }


    async updateProfile(data) {
        const payload = {
            fullName: data.fullName || data.name,
            username: data.username
        };

        return await http.patch('/admin/auth/profile', payload);
    }

    async me(data) {
        return await this.updateProfile(data);
    }


    async destroy(id) {
        return await this.delete(id);
    }

    convertBackendAdmin(backendUser) {
        return {
            id: backendUser.id,
            name: backendUser.fullName,
            fullName: backendUser.fullName,
            username: backendUser.username,
            isSuperAdmin: backendUser.isSuperAdmin,
            isActive: backendUser.isActive,
            createdAt: backendUser.createdAt,
            updatedAt: backendUser.updatedAt
        };
    }

    convertFrontendUser(frontendUser) {
        return {
            username: frontendUser.username,
            fullName: frontendUser.name || frontendUser.fullName,
            password: frontendUser.password,
            isSuperAdmin: frontendUser.admin || frontendUser.isAdmin || frontendUser.isSuperAdmin,
            isActive: frontendUser.isActive !== false
        };
    }

    async getAllWithConversion() {
        const users = await this.getAll();
        return users.map(user => this.convertBackendUser(user));
    }

    async getByIdWithConversion(id) {
        const user = await this.getById(id);
        return this.convertBackendUser(user);
    }
}

export default new AdminAPI();