import { http } from '@/services'

class MonitoringAPI {


    async search(data) {
        return await http.post('/trip-planning/search', data);
    }

    async getVehiclesRoute(routeNumber) {
        return await http.get(`/vehicles/route/${routeNumber}`);
    }

    async getAllRoutes() {
        return await http.get('/admin/routes/all');
    }

    async getActiveVehicles() {
        return await http.get('/vehicles/active');
    }

    async getStopArrivals(stopId) {
        return await http.get(`/stops/${stopId}/arrivals`);
    }

    async getNearbyStops(params) {
           return await http.get('/trip-planning/nearby-stops', { params });
    }

    createVehicleStream(routeNumbers = [], onMessage = null, onError = null) {
        const wsUrl = this.getWebSocketUrl()
        const params = routeNumbers.length ? `?routes=${routeNumbers.join(',')}` : ''

        try {
            const ws = new WebSocket(`${wsUrl}/vehicle-positions${params}`)

            ws.onopen = () => {
                console.log('✅ WebSocket соединение установлено')
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (onMessage) onMessage(data)
                } catch (error) {
                    console.error('Ошибка парсинга WebSocket сообщения:', error)
                }
            }

            ws.onerror = (error) => {
                console.error('WebSocket ошибка:', error)
                if (onError) onError(error)
            }

            ws.onclose = (event) => {
                console.log('WebSocket соединение закрыто:', event.code, event.reason)
            }

            return ws
        } catch (error) {
            console.error('Ошибка создания WebSocket:', error)
            if (onError) onError(error)
            throw error
        }
    }

    getWebSocketUrl() {
        const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
        return `${baseUrl}/ws`
    }




}

export default new MonitoringAPI()