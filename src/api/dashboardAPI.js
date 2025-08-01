
import { http } from '@/services';

class DashboardAPI {

    async getStats() {
        return await http.get('/admin/dashboard/stats');
    }

    async getLiveBuses() {
        return await http.get('/admin/vehicles/live');
    }

    async getSystemInfo() {
        return await http.get('/admin/system/info');
    }

    async getRecentActivities(limit = 5) {
        return await http.get(`/admin/activities/recent?limit=${limit}`);
    }
}

export default new DashboardAPI();