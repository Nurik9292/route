import { http } from '@/services';

class cityAPI {

    async getAll(params = {}) {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append('page', params.page);
        if (params.size) queryParams.append('size', params.size);
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.order) queryParams.append('order', params.order);
        if (params.active !== undefined) queryParams.append('active', params.active);

        const url = queryParams.toString() ?
            `admin/cities?${queryParams.toString()}` :
            'admin/cities';

        return await http.get(url);
    }

    async fetchAll() {
        const response = await http.get('admin/cities?active=true');
        return response.cities || response;
    }

    async getById(cityId) {
        return await http.get(`admin/cities/${cityId}`);
    }

    async store(data) {
        return await http.post('admin/cities', data);
    }

    async update(cityId, data) {
        return await http.put(`admin/cities/${cityId}`, data);
    }

    async delete(cityId) {
        return await http.delete(`admin/cities/${cityId}`);
    }
}

export default new cityAPI();