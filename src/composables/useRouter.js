import { RouterKey } from '@/symbols';
import { requireInjection } from '@/utils';
import Router from '@/router';

let router;

export const useRouter = () => {
  
  router = router || requireInjection(RouterKey);

  const getRouteParam = (name) => router.$currentRoute.value?.params?.[name];

  const getCurrentScreen = () => router.$currentRoute.value?.screen;

  const isCurrentScreen = (...screens) => screens.includes(router.$currentRoute.value?.screen);

  const onScreenActivated = (screen, cb) => {
    if (isCurrentScreen(screen)) {
      cb();
    }

    router.onRouteChanged((route) => {
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
  };
};
