import { http } from "@/services";


class routeAPI {

    async getAll( params ) {
        return http.get(`routes?${new URLSearchParams(params).toString()}`);
    }

    async store( data ) {
        return http.post('routes', data);
    }
}

export default new routeAPI();