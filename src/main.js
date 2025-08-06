import 'primeicons/primeicons.css';
import {createApp} from 'vue';
import {authService} from "@/services/index.js";
import {FontAwesomeIcon, FontAwesomeLayers} from '@fortawesome/vue-fontawesome';
import {library} from '@fortawesome/fontawesome-svg-core';
import {LMap, LMarker, LTileLayer} from '@vue-leaflet/vue-leaflet';
import {
    faTrash,
    faRotateLeft,
    faUserPlus,
    faBus,
    faLocationDot,
    faAngleLeft,
    faArrowRightFromBracket,
    faBars,
    faBuildingCircleExclamation,
    faCaretDown,
    faCaretUp,
    faCheck,
    faCircleCheck,
    faCircleExclamation,
    faCircleInfo,
    faCircleQuestion,
    faCity,
    faExclamation,
    faEye,
    faEyeSlash,
    faFilter,
    faHome,
    faImage,
    faInfo,
    faPlus,
    faQuestion,
    faRefresh,
    faRoute,
    faShield,
    faShop,
    faShopSlash,
    faSquareXmark,
    faTimes,
    faTimesCircle,
    faTriangleExclamation,
    faUpload,
    faUsers,
    faWarning
} from '@fortawesome/free-solid-svg-icons';
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
        faTrash, faRotateLeft, faUserPlus, faBus, faLocationDot, faHome, faTimes,
        faBars, faArrowRightFromBracket, faShop, faRoute, faCity, faUsers, faAngleLeft,
        faFilter, faPlus, faCaretUp, faCaretDown, faInfo, faCheck, faTriangleExclamation,
        faExclamation, faQuestion, faTimesCircle, faCircleCheck, faCircleInfo,
        faCircleExclamation, faWarning, faEye, faEyeSlash, faRefresh, faUpload,
        faShield, faCircleQuestion, faShopSlash, faBuildingCircleExclamation,
        faImage, faSquareXmark
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

    window.__router_instance__ = new Router(routes);

    app.provide(RouterKey, new Router(routes));
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

async function initializeApp() {
    const app = createApp(App);
    setupApp(app);

    console.log('🚀 Запуск приложения...');
    window.__app_initializing__ = true;

    try {
        // Пытаемся восстановить сессию
        const restoredUser = await authService.restoreSession();

        if (restoredUser) {
            console.log('✅ Сессия найдена:', restoredUser.username);
            window.__user_authenticated__ = true;
            window.__current_user__ = restoredUser;
        } else {
            console.log('ℹ️ Сессии нет, нужен вход');
            window.__user_authenticated__ = false;
            window.__current_user__ = null;
        }

    } catch (error) {
        console.error('❌ Ошибка проверки сессии:', error);
        window.__user_authenticated__ = false;
        window.__current_user__ = null;
    }

    // Монтируем приложение - пусть App.vue сам разбирается с маршрутизацией
    app.mount('#app');

    // Завершаем инициализацию
    window.__app_initializing__ = false;
}

// Глобальный обработчик 401 ошибок
window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;

    if (error?.response?.status === 401) {
        console.warn('🔐 401 ошибка - сбрасываем сессию');

        authService.destroy();
        window.__user_authenticated__ = false;
        window.__current_user__ = null;

        if (!window.location.hash.includes('/login')) {
            window.location.hash = '#/login';
        }

        event.preventDefault();
    }
});

initializeApp().catch(console.error);