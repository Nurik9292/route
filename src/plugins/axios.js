import axios from 'axios';
import { useRouter } from '@/composables';

const { go } = useRouter();

axios.defaults.baseURL = process.env.VUE_APP_API_HOST;

axios.interceptors.response.use(null, function (error) {
    if (error.response.status === 401) {
      console.log('Failed to login');
      go('/sign-in');
    }
    return Promise.reject(error);
})

