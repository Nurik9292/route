import { http } from '@/services';

class cityAPI {

    async getAll( params ) {
        return await http.get(`cities?${new URLSearchParams(params).toString()}`);
    }

    async store( data ) {
        return await http.post('cities', data);
    }

    async update( cityId, data ) {
        return await http.patch(`cities/${cityId}`, data);        
    }

    async delete( cityId ) {
        return await http.delete(`cities/${cityId}`);
    }
}

export default new cityAPI();