
import { createApp } from 'vue';
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBars, faHome, faTimes, faArrowRightFromBracket, faShop, faRoute, faCity, faUsers, faAngleLeft, faFilter, faPlus } from '@fortawesome/free-solid-svg-icons';

import App from './App.vue';
import Router from './router';
import directives from './directives';
import { RouterKey } from './symbols';
import { routes } from '@/config';

import './assets/app.pcss';

library.add(faHome, faTimes, faBars, faArrowRightFromBracket, faShop, faRoute, faCity, faUsers, faAngleLeft, faFilter, faPlus);


const app = createApp(App);

app.component('Icon', FontAwesomeIcon);
app.component('IconLayers', FontAwesomeLayers);

directives.forEach(directive => {
    app.directive(directive.name, directive);
})

app.provide(RouterKey, new Router(routes));
app.mount('#app');
