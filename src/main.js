import 'primeicons/primeicons.css';
import { createApp } from 'vue';
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';
import { 
    faBars, 
    faHome, 
    faTimes, 
    faArrowRightFromBracket, 
    faShop, 
    faRoute, 
    faCity, 
    faUsers, 
    faAngleLeft, 
    faFilter, 
    faPlus,
    faCaretUp,
    faCaretDown,
    faInfo,
    faCheck,
    faTriangleExclamation,
    faExclamation,
    faQuestion,
    faTimesCircle,
    faCircleCheck,
    faCircleInfo,
    faCircleExclamation,
    faWarning,
    faEye,
    faEyeSlash,
    faRefresh,
    faUpload,
    faShield,
    faCircleQuestion,
    faShopSlash,
    faBuildingCircleExclamation,
    faImage, 
    faSquareXmark} from '@fortawesome/free-solid-svg-icons';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import PickList from 'primevue/picklist';
import Listbox from 'primevue/listbox';
import { definePreset } from '@primevue/themes';


import App from './App.vue';
import Router from './router';
import directives from './directives';
import store from './store';
import { RouterKey } from './symbols';
import { routes } from '@/config';


import './assets/app.pcss';


library.add(
    faHome, 
    faTimes, 
    faBars, 
    faArrowRightFromBracket, 
    faShop, 
    faRoute, 
    faCity, 
    faUsers, 
    faAngleLeft, 
    faFilter, 
    faPlus,
    faCaretUp,
    faCaretDown,
    faInfo,
    faCheck,
    faTriangleExclamation,
    faExclamation,
    faQuestion,
    faTimesCircle,
    faCircleCheck,
    faCircleInfo,
    faCircleExclamation,
    faWarning,
    faEye,
    faEyeSlash,
    faRefresh,
    faUpload,
    faShield,
    faCircleQuestion,
    faShopSlash,
    faBuildingCircleExclamation,
    faImage,
    faSquareXmark);


const app = createApp(App);

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


app.provide(RouterKey, new Router(routes));
app.use(store);
app.use(PrimeVue,  { 
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
})

app.mount('#app');
