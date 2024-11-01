import { http } from '@/services';

class userAPI {
   
    async destroy( id ) {
        await http.delete(`users/${id}`);
    }

    async getAll() {
        return await http.get('users');
    }

    async store( data ) {
        return await http.post('users', data);
    }

    async update( id, data ) {
        return await http.put(`users/${id}`, data);
    }

    async me( data ) {
        return await http.put('me', data);
    }
}

export default new userAPI();