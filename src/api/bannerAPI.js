import { http } from '@/services';
import { walk } from 'vue/compiler-sfc';

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
}

export default new BannerAPI();