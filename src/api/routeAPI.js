import {http} from '@/services';

class RouteAPI {
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/admin/routes?${queryString}` : '/admin/routes';
        return await http.get(url);
    }

    async getById(id) {
        return await http.get(`/admin/routes/${id}`);
    }

    async store(data) {
        const payload = {
            routeNumber: data.number,
            routeName: data.name,
            routeNameTm: data.nameTm,
            farePrice: data.farePrice || 0.5,
            estimatedDurationMinutes: data.estimatedDuration || 30,
            forwardStopIds: data.fromStops || [],
            backwardStopIds: data.toStops || [],
            routeGeometryForward: data.forwardGeometry,
            routeGeometryBackward: data.backwardGeometry
        };

        return await http.post('/admin/routes', payload);
    }

    async update(id, data) {
        const payload = {
            routeNumber: data.number,
            routeName: data.name,
            routeNameTm: data.nameTm,
            farePrice: data.farePrice,
            estimatedDurationMinutes: data.estimatedDuration,
            forwardStopIds: data.fromStops,
            backwardStopIds: data.toStops,
            routeGeometryForward: data.forwardGeometry,
            routeGeometryBackward: data.backwardGeometry
        };

        return await http.put(`/admin/routes/${id}`, payload);
    }

    async delete(id) {
        return await http.delete(`/admin/routes/${id}`);
    }

    async getRouteGeometry(routeNumber) {
        return await http.silently.get(`/routes/${routeNumber}/geometry`);
    }

    async getActiveRoutes() {
        return await http.silently.get('/routes/active');
    }
}

export default new RouteAPI();