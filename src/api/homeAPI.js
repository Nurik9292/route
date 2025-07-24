
import { http } from "@/services";

class homeAPI {

    async fetchData() {
        return await http.get('home');
    }
}

export default new homeAPI();