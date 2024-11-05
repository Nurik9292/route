
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
    faShopSlash } from '@fortawesome/free-solid-svg-icons';

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
    faShopSlash);


const app = createApp(App);


app.provide(RouterKey, new Router(routes));
app.use(store);
app.component('Icon', FontAwesomeIcon);
app.component('IconLayers', FontAwesomeLayers);
app.component('LMap', LMap);
app.component('LTileLayer', LTileLayer);
app.component('LMarker', LMarker);

directives.forEach(directive => {
    app.directive(directive.name, directive);
})

app.mount('#app');
