import { http } from "@/services";


class routeAPI {

    async getAll( params ) {
        return http.get(`routes?${new URLSearchParams(params).toString()}`);
    }
}

export default new routeAPI();