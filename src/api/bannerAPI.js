import {http} from '@/services';

class BannerAPI {
    async getAll(params) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/admin/banners?${queryString}` : '/admin/banners';
        return await http.get(url);
    }

    async store(data) {
        return await http.post('/admin/banners', data);
    }

    async delete(urlImage) {
        return await http.delete(`/admin/banners/${urlImage}`);
    }

    async getById(bannerId) {
        const response = await http.get(`/admin/banners/${bannerId}`);
        return response.data;
    }

    async update(bannerId, data) {
        return await http.put(`/admin/banners/${bannerId}`, data);
    }

    async destroy(bannerId) {
        await http.delete(`/admin/banners/${bannerId}`);
    }

    async toggleStatus(bannerId, params) {
        console.log('banner api', bannerId, params)
        const queryString = new URLSearchParams(params).toString();
        const url = `/admin/banners/toggle-status/${bannerId}?${queryString}`;
        return await http.get(url);
    }

    async uploadImage(formData) {
        return await http.post('/admin/banners/upload', formData)

    }

    getImageUrl(filename) {
        return `/admin/banners/${filename}`;
    }
}

export default new BannerAPI();