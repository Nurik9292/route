import { http } from '@/services';


class authAPI {
    postSignIn( credentials ) {
      
      return http.post( 'auth/login', credentials );
    }

    async delete() {
      await http.delete('auth/logout');
    }

   
}


export default new authAPI();