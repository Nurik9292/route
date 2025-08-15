import {http} from '@/services';

export default {
    async getAll(params = {}) {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append('page', params.page);
        if (params.size) queryParams.append('size', params.size);
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.order) queryParams.append('order', params.order);
        if (params.active !== undefined) queryParams.append('active', params.active);
        if (params.cityId) queryParams.append('cityId', params.cityId);

        const url = queryParams.toString() ?
            `admin/routes?${queryParams.toString()}` :
            'admin/routes';

        return await http.get(url);
    },

    async getById(routeId) {
        const response = await http.get(`/admin/routes/${routeId}`);
        return response.data;
    },

    async store(routeData) {
        return await http.post('/admin/routes', routeData);

    },

    async update(routeId, routeData) {
        return await http.put(`/admin/routes/${routeId}`, routeData);
    },

    async delete(routeId) {
        await http.delete(`/admin/routes/${routeId}`);
    },

    async updateStatus(routeId, statusData) {
        return await http.patch(`/admin/routes/${routeId}/status`, statusData);
    },


    async getRouteGeometry(routeNumber) {
        const response = await http.get(`/routes/${routeNumber}/geometry`);
        return response.data;
    },

    async updateRouteGeometry(routeNumber, geometryData) {
        const response = await http.put(`/routes/${routeNumber}/geometry`, {
            geometry: geometryData.geometry,
            update_reason: geometryData.update_reason || 'Manual update from admin panel'
        });

        return response.data;
    },


    async getRouteStops(routeNumber, direction = 0) {
        const response = await http.get(`/routes/${routeNumber}/stops`, {
            params: { direction }
        });

        return response.data || [];
    },

    async addStopToRoute(routeNumber, stopData) {
        const response = await http.post(`/routes/${routeNumber}/stops`, {
            stop_id: stopData.stop_id || stopData.stopId,
            direction: stopData.direction || 0,
            sequence_order: stopData.sequence_order || stopData.sequenceOrder,
            distance_from_start: stopData.distance_from_start || stopData.distanceFromStart || 0
        });

        return response.data;
    },

    async removeStopFromRoute(routeNumber, stopId, direction = 0) {
        await http.delete(`/routes/${routeNumber}/stops/${stopId}`, {
            params: { direction }
        });
    },


    async getRouteInfo(routeNumber) {
        const response = await http.get(`/routes/${routeNumber}/info`);
        return response.data;
    },

    async findNearbyRoutes(lat, lon, radius = 1000) {
        const response = await http.get('/routes/nearby', {
            params: { lat, lon, radius }
        });

        return response.data || [];
    },

    async getActiveRoutes() {
        const response = await http.get('/routes/active');
        return response.data || [];
    },


    async getStatistics() {
        const response = await http.get('/admin/routes/statistics');
        return response.data;
    },

    async getRouteReport(routeNumber, params = {}) {
        const response = await http.get(`/admin/routes/${routeNumber}/report`, {
            params: {
                start_date: params.startDate,
                end_date: params.endDate,
                include_performance: params.includePerformance || false,
                include_stops: params.includeStops || false
            }
        });

        return response.data;
    },


    async bulkUpdateStatus(routeIds, isActive) {
        const response = await http.patch('/admin/routes/bulk/status', {
            route_ids: routeIds,
            is_active: isActive
        });

        return response.data;
    },

    async exportRoutes(params = {}) {
        const response = await http.get('/admin/routes/export', {
            params: {
                format: params.format || 'csv',
                include_geometry: params.includeGeometry || false,
                include_stops: params.includeStops || false,
                active_only: params.activeOnly || false
            },
            responseType: 'blob'
        });

        return response.data;
    },

    async importRoutes(file, options = {}) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('update_existing', options.updateExisting || false);
        formData.append('validate_geometry', options.validateGeometry || true);

        const response = await http.post('/admin/routes/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    },


    async checkRouteNumberAvailability(routeNumber, excludeRouteId = null) {
        const queryParams = new URLSearchParams();
        queryParams.append('routeNumber',routeNumber);

        const url = `/admin/routes/check-availability?${queryParams.toString()}`;

        const  response = await http.get(url);
        return !response.available || false;
    },

    async validateRouteGeometry(geometry) {
        const response = await http.post('/admin/routes/validate-geometry', {
            geometry
        });

        return response.data;
    },

};