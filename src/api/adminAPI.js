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
            full_name: data.fullName || data.name,
            is_super_admin: data.isSuperAdmin || false,
            is_active: data.isActive !== false
        };

        return await http.post('/admin/users', payload);
    }

    async update(id, data) {
        const payload = {
            username: data.username,
            full_name: data.fullName || data.name,
            is_super_admin: data.isSuperAdmin,
            is_active: data.isActive,
        };

        if (data.password && data.password.trim()) {
            payload.new_password = data.password;
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
        return await http.patch('/admin/users/profile', data);
    }

    async me(data) {
        return await this.updateProfile(data);
    }


    async destroy(id) {
        return await this.delete(id);
    }

    async updateCurrentAdminAvatar(data) {
        return await http.patch('/admin/users/profile/avatar', data);
    }

    async removeCurrentAdminAvatar() {
        return await http.delete('/admin/users/profile/avatar');
    }

    convertBackendAdmin(backendUser) {
        return {
            id: backendUser.id,
            fullName: backendUser.full_name,
            username: backendUser.username,
            isSuperAdmin: backendUser.is_super_admin,
            isActive: backendUser.is_active,
            createdAt: backendUser.createdAt,
            updatedAt: backendUser.updatedAt,
            lastLoginAt: backendUser.last_login_at
        };
    }

    convertFrontendUser(frontendUser) {
        return {
            username: frontendUser.username,
            fullName: frontendUser.fullName,
            password: frontendUser.password,
            isSuperAdmin: frontendUser.isSuperAdmin,
            isActive: frontendUser.isActive !== false
        };
    }

    async getAllWithConversion() {
        const admins = await this.getAll();
        return admins.map(admin => this.convertBackendAdmin(admin));
    }

    async getByIdWithConversion(id) {
        const admin = await this.getById(id);
        return this.convertBackendAdmin(admin);
    }


}

export default new AdminAPI();