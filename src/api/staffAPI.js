import { http } from '@/services';

class staffAPI {
   
    async destroy( id ) {
        await http.delete(`staff/${id}`);
    }

    async getAll() {
        return await http.get('staff');
    }

    async store( data ) {
        return await http.post('staff', data);
    }

    async update( data ) {
        return await http.patch(`staff/${data.userId}`, data.data);
    }

    async me( data ) {
        return await http.patch('staff/me', data);
    }

    async fetchAvatar( avatar ) {
        return await http.get(`staff/avatar/${avatar}`,  { responseType: 'blob' });
    }
}

export default new staffAPI();