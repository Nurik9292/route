import { ref, watch } from 'vue'
import { forceReloadWindow } from '@/utils'
import { authService } from '@/services'
import { logger } from '@/utils'

export default class Router {

  routes;
  homeRoute;
  notFoundRoute;
  routeChangedHandlers;
  cache;

  constructor(routes) {
    this.routes = routes
    this.homeRoute = routes.find(({ screen }) => screen === 'Home')
    this.notFoundRoute = routes.find(({ screen }) => screen === '404')
    this.$currentRoute = ref(this.homeRoute)
    this.routeChangedHandlers = []
    this.cache = new Map()

    watch(
        this.$currentRoute,
        (newValue, oldValue) => {
          this.routeChangedHandlers.forEach(async handler => await handler(newValue, oldValue))
        },
        {
          deep: true,
          immediate: true
        }
    )

    addEventListener('popstate', () => this.resolve(), true)
  }

  static go(path, reload = false) {
    if (typeof path === 'number') {
      history.go(path);
      return;
    }

    if (!path.startsWith('/')) {
      path = `/${path}`;
    }

    if (!path.startsWith('/#')) {
      path = `/#${path}`;
    }

    const newHash = path.substring(1);

    if (newHash && newHash !== '/' && newHash !== '/home') {
      sessionStorage.setItem('last_route', newHash);
      console.log('💾 Saving route before navigation:', newHash);
    }

    if (reload) {
      location.assign(`${location.origin}${location.pathname}${newHash}`);
      forceReloadWindow();
    } else {
      location.hash = newHash;

      const router = window.__router_instance__;
      if (router) {
         router.resolve().then(r => logger.info(r));
      }
    }
  }

  async resolve() {
    const currentPath = this.getCurrentPath();

    console.log('🔄 Router resolving:', {
      locationHash: location.hash,
      currentPath,
      isReload: !location.hash && sessionStorage.getItem('last_route')
    });

    if ((!location.hash || location.hash === '#/' || location.hash === '#!/')) {
      const savedRoute = sessionStorage.getItem('last_route');

      if (savedRoute && savedRoute !== '/home' && savedRoute !== '/') {
        console.log('🔄 Restoring route after page reload:', savedRoute);
        location.hash = `#${savedRoute}`;
        return this.resolve();
      }

      console.log('🏠 No saved route, going to home');
      return Router.go(this.homeRoute.path);
    }

    const matched = this.tryMatchRoute();
    const [route, params] = matched ? [matched.route, matched.params] : [null, null];

    if (!route) {
      return this.triggerNotFound();
    }

    const authCheckResult = await this.checkRouteAuthentication(route);
    if (!authCheckResult) {
      return;
    }

    if ((await route.onResolve?.(params)) === false) {
      return this.triggerNotFound();
    }

    if (route.redirect) {
      const to = route.redirect(params);
      return typeof to === 'string' ? Router.go(to) : this.activateRoute(to, params);
    }

    this.saveCurrentRoute();

    return this.activateRoute(route, params);
  }

  getCurrentPath() {
    if (!location.hash) return '/';

    let path = location.hash.replace(/^#!?/, '');
    if (!path.startsWith('/')) path = '/' + path;

    return path;
  }

  saveCurrentRoute() {
    const currentPath = this.getCurrentPath();
    if (currentPath && currentPath !== '/') {
      sessionStorage.setItem('last_route', currentPath);
      console.log('💾 Saved current route:', currentPath);
    }
  }

  async checkRouteAuthentication(route) {
    const publicRoutes = ['Login', 'SignIn', '404', 'NotFound'];

    if (publicRoutes.includes(route.screen)) {
      if (this.isUserAuthenticated() && (route.screen === 'Login' || route.screen === 'SignIn')) {
        logger.info('🔄 Пользователь уже авторизован, редирект на главную');
        Router.go(this.homeRoute.path);
        return false;
      }
      return true;
    }

    if (!this.isUserAuthenticated()) {
      logger.warn('🔐 Доступ к защищенному роуту без аутентификации:', route.screen);


      Router.go('/login');
      return false;
    }

    if (route.requiresRole) {
      const currentUser = this.getCurrentUser();

      if (!currentUser || !this.hasRequiredRole(currentUser, route.requiresRole)) {
        logger.warn('🚫 Недостаточно прав для доступа к роуту:', route.screen);

        Router.go('/access-denied');
        return false;
      }
    }

    return true;
  }

  isUserAuthenticated() {
    return window.__user_authenticated__ === true && this.getCurrentUser() !== null;
  }

  getCurrentUser() {
    return window.__current_user__ || authService.getAdminData();
  }

  hasRequiredRole(user, requiredRole) {
    if (requiredRole === 'admin') {
      return user.isActive === true;
    }

    if (requiredRole === 'super_admin') {
      return user.isSuperAdmin === true && user.isActive === true;
    }

    return true;
  }

  static restoreRouteAfterLogin() {
    const savedRoute = sessionStorage.getItem('redirect_after_login');
    sessionStorage.removeItem('redirect_after_login');

    if (savedRoute && savedRoute !== '#/login' && savedRoute !== '#/sign-in') {
      logger.info('🔄 Восстанавливаем роут после входа:', savedRoute);
      location.hash = savedRoute;
    } else {
        Router.go('/home');
    }
  }

  async triggerNotFound() {
    return this.activateRoute(this.notFoundRoute)
  }

  onRouteChanged(handler) {
    this.routeChangedHandlers.push(handler)
  }

  async activateRoute(route, params = {}) {
    this.$currentRoute.value = route
    this.$currentRoute.value.params = params
  }

  tryMatchRoute() {
    if (!this.cache.has(location.hash)) {
      for (let i = 0; i < this.routes.length; i++) {
        const route = this.routes[i]
        const matches = location.hash.match(new RegExp(`^#!?${route.path}/?(?:\\?(.*))?$`))

        if (matches) {
          const searchParams = new URLSearchParams(new URL(location.href.replace('#/', '')).search)

          this.cache.set(location.hash, {
            route,
            params: Object.assign(Object.fromEntries(searchParams.entries()), matches.groups || {})
          })

          break
        }
      }
    }

    return this.cache.get(location.hash)
  }
}