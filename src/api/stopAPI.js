import { http } from '@/services';


class stopAPI {

    async getAll( params ) {
        return await http.get(`stops?${new URLSearchParams(params).toString()}`);
    }

    async store ( data ) {
        return await http.post('stops', data);
    }

    async update ( id, data ) {
        return await http.patch(`stops/${id}`, data);
    }

    async destroy ( id ) {
        return await http.delete(`stops/${id}`);
    }


}

export default new stopAPI();
