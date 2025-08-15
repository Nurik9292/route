import { http } from '@/services'
import { logger } from "@/utils/index.js";

class MonitoringAPI {


    async search(params) {
        try {
            logger.info('📡 API запрос:', params)

            const response = await http.post('/trip-planning/search', params)
            console.log('search search', response)
            let normalizedResponse = null

            if (response) {
                const data = response

                if (data.trip_options && Array.isArray(data.trip_options)) {
                    normalizedResponse = {
                        trip_options: data.trip_options,
                        status: data.status || 'success'
                    }
                    logger.info('✅ Формат: trip_options массив, элементов:', data.trip_options.length)
                }

                // Вариант 2: Одиночный объект с option_id (как в вашем JSON)
                else if (data.option_id) {
                    normalizedResponse = {
                        trip_options: [data],
                        status: 'success'
                    }
                    logger.info('✅ Формат: одиночный объект, обернут в массив')
                }

                // Вариант 3: Прямой массив в data
                else if (Array.isArray(data)) {
                    normalizedResponse = {
                        trip_options: data,
                        status: 'success'
                    }
                    logger.info('✅ Формат: прямой массив, элементов:', data.length)
                }

                // Вариант 4: Неизвестный формат
                else {
                    logger.warn('⚠️ Неизвестный формат ответа API:', data)
                    normalizedResponse = {
                        trip_options: [],
                        status: 'error',
                        message: 'Неподдерживаемый формат ответа'
                    }
                }
            } else {
                logger.warn('⚠️ Пустой ответ от API')
                normalizedResponse = {
                    trip_options: [],
                    status: 'error',
                    message: 'Пустой ответ'
                }
            }

            return normalizedResponse

        } catch (error) {
            logger.error('❌ Ошибка API запроса:', error)

            // Проверяем есть ли данные в ошибке
            if (error.response && error.response.data) {
                throw error
            }

            throw new Error('Сервис временно недоступен')
        }
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