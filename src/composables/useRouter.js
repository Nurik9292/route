import { RouterKey } from '@/symbols';
import { requireInjection } from '@/utils';
import Router from '@/router';

let router;

export const useRouter = () => {
  // ✅ Улучшенное получение router instance
  if (!router) {
    try {
      router = requireInjection(RouterKey);
      console.log('🔧 Router получен через injection:', router);
    } catch (error) {
      // Fallback к глобальному инстансу
      router = window.__router_instance__;
      console.log('🔧 Router получен через window:', router);
    }
  }

  if (!router) {
    console.error('❌ Router не найден!');
    throw new Error('Router не найден');
  }

  const getRouteParam = (name) => {
    const param = router.$currentRoute.value?.params?.[name];
    console.log('🔧 getRouteParam:', name, '→', param);
    return param;
  };

  const getCurrentScreen = () => {
    const screen = router.$currentRoute.value?.screen;
    console.log('🔧 getCurrentScreen() →', screen);
    console.log('🔧 Full currentRoute:', router.$currentRoute.value);
    return screen;
  };

  const isCurrentScreen = (...screens) => {
    const current = router.$currentRoute.value?.screen;
    const result = screens.includes(current);
    console.log('🔧 isCurrentScreen:', screens, 'current:', current, '→', result);
    return result;
  };

  const onScreenActivated = (screen, cb) => {
    console.log('🔧 onScreenActivated для:', screen);

    if (isCurrentScreen(screen)) {
      console.log('🔧 Экран уже активен, вызываем callback');
      cb();
    }

    router.onRouteChanged((route) => {
      console.log('🔧 onRouteChanged в onScreenActivated:', route.screen, '=== screen:', screen);
      if (route.screen === screen) {
        cb();
      }
    });
  };

  return {
    getRouteParam,
    getCurrentScreen,
    isCurrentScreen,
    onScreenActivated,
    go: Router.go,
    onRouteChanged: router.onRouteChanged.bind(router),
    resolveRoute: router.resolve.bind(router),
    triggerNotFound: router.triggerNotFound.bind(router),
    router // ✅ Добавляем прямой доступ к router для отладки
  };
};