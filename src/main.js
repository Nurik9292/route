import 'primeicons/primeicons.css';
import {createApp} from 'vue';
import {FontAwesomeIcon, FontAwesomeLayers} from '@fortawesome/vue-fontawesome';
import {library} from '@fortawesome/fontawesome-svg-core';
import {LMap, LMarker, LTileLayer} from '@vue-leaflet/vue-leaflet';
import {faTrash, faRotateLeft, faUserPlus, faBus, faLocationDot,  faAngleLeft, faArrowRightFromBracket, faBars,
    faBuildingCircleExclamation, faCaretDown, faCaretUp, faCheck, faCircleCheck, faCircleExclamation, faCircleInfo,
    faCircleQuestion, faChevronDown, faCity, faExclamation, faEye, faEyeSlash, faFilter, faHome, faImage, faInfo,
    faPlus, faQuestion, faRefresh, faSort, faRoute, faShield, faShop, faShopSlash, faSquareXmark, faTimes,
    faTimesCircle, faTriangleExclamation, faSpinner, faUpload, faUsers, faWarning, faSortUp, faSortDown, faPenToSquare,
    faStar, faClock, faMap, faPlay, faPause, faDownload, faPencilAlt, faXmark, faSave, faArrowLeft, faArrowRight,
    faSearch, faPlusCircle, faExchange, faCopy, faExchangeAlt, faClone, faTrashAlt, faGripVertical, faImages,
    faCloudUploadAlt, faCamera, faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import PickList from 'primevue/picklist';
import Listbox from 'primevue/listbox';
import {definePreset} from '@primevue/themes';

import App from './App.vue';
import Router from './router';
import directives from './directives';
import store from './store';
import {RouterKey} from './symbols';
import {routes} from '@/config';

import './assets/app.pcss';

function setupApp(app) {
    library.add(
        faTrash, faRotateLeft, faUserPlus, faBus, faLocationDot, faHome, faTimes, faClock, faMap, faPlay, faPause,
        faBars, faArrowRightFromBracket, faShop, faRoute, faCity, faUsers, faAngleLeft, faDownload, faPencilAlt,
        faFilter, faPlus, faCaretUp, faCaretDown, faInfo, faCheck, faTriangleExclamation, faXmark, faSave,
        faExclamation, faQuestion, faTimesCircle, faCircleCheck, faCircleInfo, faArrowLeft, faArrowRight, faPlusCircle,
        faCircleExclamation, faWarning, faEye, faEyeSlash, faRefresh, faUpload, faSearch, faExchange, faCopy,
        faShield, faCircleQuestion, faShopSlash, faBuildingCircleExclamation, faExchangeAlt, faClone, faTrashAlt,
        faImage, faSquareXmark, faSortUp, faChevronDown, faSortDown, faPenToSquare, faSort, faSpinner, faStar, farStar,
        faGripVertical, faImages, faCloudUploadAlt, faCamera, faChartLine
    );

    const MyPreset = definePreset(Aura, {
        semantic: {
            primary: {
                50: '{amber.50}',
                100: '{amber.100}',
                200: '{amber.200}',
                300: '{amber.300}',
                400: '{amber.400}',
                500: '{amber.500}',
                600: '{amber.600}',
                700: '{amber.700}',
                800: '{amber.800}',
                900: '{amber.900}',
                950: '{amber.950}'
            }
        }
    });
    const newRoute = new Router(routes);
    window.__router_instance__ = newRoute;

    app.provide(RouterKey, newRoute);
    app.use(store);
    app.use(PrimeVue, {
        ripple: true,
        theme: {
            preset: MyPreset,
            options: {
                prefix: 'p',
                darkModeSelector: '.p-dark',
                cssLayer: false,
            }
        }
    });

    app.component('Icon', FontAwesomeIcon);
    app.component('IconLayers', FontAwesomeLayers);
    app.component('LMap', LMap);
    app.component('LTileLayer', LTileLayer);
    app.component('LMarker', LMarker);
    app.component('PickList', PickList);
    app.component('Listbox', Listbox);

    directives.forEach(directive => {
        app.directive(directive.name, directive);
    });
}



const app = createApp(App);
setupApp(app);

app.mount('#app');
