import {http} from '@/services';

class StopAPI {
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/admin/bus-stops?${queryString}` : '/admin/bus-stops';
        return await http.get(url);
    }

    async getById(id) {
        return await http.get(`/admin/bus-stops/${id}`);
    }

    async store(data) {
        const payload = {
            stopName: data.name,
            stopNameTm: data.nameTm,
            latitude: data.coordinates?.lat || data.latitude,
            longitude: data.coordinates?.lng || data.longitude,
            cityId: data.cityId || null
        };

        return await http.post('/admin/bus-stops', payload);
    }

    async update(id, data) {
        const payload = {
            stopName: data.name,
            stopNameTm: data.nameTm,
            latitude: data.coordinates?.lat || data.latitude,
            longitude: data.coordinates?.lng || data.longitude,
            cityId: data.cityId
        };

        return await http.put(`/admin/bus-stops/${id}`, payload);
    }

    async delete(id) {
        return await http.delete(`/admin/bus-stops/${id}`);
    }

    async getNearbyStops(lat, lon, radius = 800) {
        return await http.silently.get(
            `/stops/nearby?lat=${lat}&lon=${lon}&radius=${radius}`
        );
    }
}

export default new StopAPI();