import { http } from '@/services';
import { walk } from 'vue/compiler-sfc';

class bannerAPI {

    async getAll( params ) {
        return  await http.get(`banners?${new URLSearchParams(params).toString()}`);
    }

    async store( data ) {
        return await http.post('banners', data);
    }

    async delete( urlImage) {
        return await http.delete(`banners/${urlImage}`);
    }
}

export default new bannerAPI();