
import { http } from '@/services';

class StopAPI {

    async getAll(params = {}) {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append('page', params.page);
        if (params.size) queryParams.append('size', params.size);
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.order) queryParams.append('order', params.order);
        if (params.active !== undefined) queryParams.append('active', params.active);
        if (params.cityId) queryParams.append('cityId', params.cityId);

        const url = queryParams.toString() ?
            `admin/stops?${queryParams.toString()}` :
            'admin/stops';

        return await http.get(url);
    }


    async fetchAll() {
        const response = await http.get('admin/stops?active=true&size=1000');
        return response.stops || response;
    }


    async getById(stopId) {
        return await http.get(`admin/stops/${stopId}`);
    }


    async store(data) {
        return await http.post('admin/stops', data);
    }


    async update(stopId, data) {
        return await http.put(`admin/stops/${stopId}`, data);
    }

    async delete(stopId) {
        return await http.delete(`admin/stops/${stopId}`);
    }


    async getNearbyStops(lat, lon, radius = 800) {
        return await http.silently.get(
            `stops/nearby?lat=${lat}&lon=${lon}&radius=${radius}`
        );
    }


    async getStopArrivals(stopId) {
        return await http.silently.get(`stops/${stopId}/arrivals`);
    }
}

export default new StopAPI();