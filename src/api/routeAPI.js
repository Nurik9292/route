import { http } from '@/services';

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
            routeGeometryBackward: data.backwardGeometry,
            isActive: data.isActive !== false
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
            routeGeometryBackward: data.backwardGeometry,
            isActive: data.isActive
        };

        return await http.put(`/admin/routes/${id}`, payload);
    }

    async delete(id) {
        return await http.delete(`/admin/routes/${id}`);
    }

    async updateGeometry(id, geometry) {
        const payload = {
            routeGeometryForward: geometry.forward,
            routeGeometryBackward: geometry.backward
        };

        return await http.put(`/admin/routes/${id}/geometry`, payload);
    }

    async getRouteGeometry(routeNumber) {
        return await http.silently.get(`/routes/${routeNumber}/geometry`);
    }

    async getActiveRoutes() {
        return await http.silently.get('/routes/active');
    }

    async getRouteDetails(routeNumber) {
        return await http.get(`/routes/${routeNumber}`);
    }

    async getRouteStops(routeNumber, direction = 'forward') {
        return await http.get(`/routes/${routeNumber}/stops?direction=${direction}`);
    }

    async addStopToRoute(routeId, stopId, direction, sequence) {
        const payload = {
            stopId,
            direction, // 'forward' или 'backward'
            sequence
        };

        return await http.post(`/admin/routes/${routeId}/stops`, payload);
    }

    async removeStopFromRoute(routeId, stopId, direction) {
        return await http.delete(`/admin/routes/${routeId}/stops/${stopId}?direction=${direction}`);
    }

    async updateStopSequence(routeId, direction, stopsSequence) {
        const payload = {
            direction,
            stopsSequence // массив { stopId, sequence }
        };

        return await http.put(`/admin/routes/${routeId}/stops/sequence`, payload);
    }

    async activate(id) {
        return await http.post(`/admin/routes/${id}/activate`);
    }

    async deactivate(id) {
        return await http.post(`/admin/routes/${id}/deactivate`);
    }

    async validateRoute(routeData) {
        return await http.post('/admin/routes/validate', routeData);
    }

    async getRouteStats() {
        return await http.get('/admin/routes/stats');
    }

    async searchRoutes(query) {
        return await http.get(`/routes/search?q=${encodeURIComponent(query)}`);
    }

    async exportRoutes(format = 'json') {
        return await http.get(`/admin/routes/export?format=${format}`);
    }

    async importRoutes(file) {
        const formData = new FormData();
        formData.append('file', file);

        return await http.post('/admin/routes/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}

export default new RouteAPI();