import { ref, watch } from 'vue'
import { forceReloadWindow } from '@/utils'
import { authService } from '@/services'
import { logger } from '@/utils'

export default class Router {
  constructor(routes) {
    this.routes = routes
    this.homeRoute = routes.find(({ screen }) => screen === 'Home')
    this.notFoundRoute = routes.find(({ screen }) => screen === '404')
    this.$currentRoute = ref(this.homeRoute)
    this.routeChangedHandlers = []
    this.cache = new Map()
    this.isResolving = false

    watch(this.$currentRoute, (newValue, oldValue) => {
      this.routeChangedHandlers.forEach(handler => handler(newValue, oldValue))
    }, { deep: true, immediate: true })

    addEventListener('popstate', () => this.resolve(), true)
  }

  static go(path, reload = false) {
    if (typeof path === 'number') {
      history.go(path)
      return
    }

    if (!path.startsWith('/')) path = `/${path}`
    if (!path.startsWith('/#')) path = `/#${path}`

    const newHash = path.substring(1)

    // Сохраняем только значимые роуты
    if (newHash && newHash !== '/' && newHash !== '/home' && newHash !== '/login') {
      sessionStorage.setItem('last_route', newHash)
      console.log('💾 Сохраняем роут:', newHash)
    }

    if (reload) {
      location.assign(`${location.origin}${location.pathname}${newHash}`)
      forceReloadWindow()
    } else {
      location.hash = newHash
    }
  }

  async resolve() {
    // Защита от повторных вызовов
    if (this.isResolving || window.__app_initializing__) {
      console.log('⏳ Роутер занят или приложение инициализируется')
      return
    }

    this.isResolving = true

    try {
      const currentPath = this.getCurrentPath()
      console.log('🔄 Обрабатываем роут:', currentPath)

      // Если пустой путь - восстанавливаем или идем на home
      if (!location.hash || location.hash === '#/' || location.hash === '#!/') {
        return this.handleEmptyRoute()
      }

      // Ищем подходящий роут
      const matched = this.tryMatchRoute()
      if (!matched) {
        return this.triggerNotFound()
      }

      const { route, params } = matched

      // Проверяем права доступа
      if (!(await this.checkAuth(route))) {
        return
      }

      // Вызываем onResolve если есть
      if (route.onResolve && (await route.onResolve(params)) === false) {
        return this.triggerNotFound()
      }

      // Обрабатываем редирект
      if (route.redirect) {
        const to = route.redirect(params)
        return typeof to === 'string' ? Router.go(to) : this.activateRoute(to, params)
      }

      // Сохраняем текущий роут и активируем
      this.saveCurrentRoute()
      return this.activateRoute(route, params)

    } finally {
      this.isResolving = false
    }
  }

  handleEmptyRoute() {
    const savedRoute = sessionStorage.getItem('last_route')

    // Восстанавливаем сохраненный роут если есть
    if (savedRoute && savedRoute !== '/home' && savedRoute !== '/' && savedRoute !== '/login') {
      console.log('🔄 Восстанавливаем сохраненный роут:', savedRoute)
      location.hash = `#${savedRoute}`
      return
    }

    // Иначе идем на главную
    console.log('🏠 Переход на главную')
    Router.go(this.homeRoute.path)
  }

  getCurrentPath() {
    if (!location.hash) return '/'
    let path = location.hash.replace(/^#!?/, '')
    if (!path.startsWith('/')) path = '/' + path
    return path
  }

  saveCurrentRoute() {
    const currentPath = this.getCurrentPath()
    if (currentPath && currentPath !== '/' && currentPath !== '/home' && currentPath !== '/login') {
      sessionStorage.setItem('last_route', currentPath)
      console.log('💾 Сохранили текущий роут:', currentPath)
    }
  }

  async checkAuth(route) {
    const publicRoutes = ['Login', 'SignIn', '404', 'NotFound']

    // Публичные роуты
    if (publicRoutes.includes(route.screen)) {
      // Если уже залогинен, а пытается зайти на login - редирект на главную
      if (this.isUserAuthenticated() && (route.screen === 'Login' || route.screen === 'SignIn')) {
        console.log('🔄 Уже авторизован, переход на главную')
        Router.go(this.homeRoute.path)
        return false
      }
      return true
    }

    // Приватные роуты - нужна авторизация
    if (!this.isUserAuthenticated()) {
      console.log('🔐 Нет авторизации, переход на вход')
      Router.go('/login')
      return false
    }

    // Проверяем роли если нужно
    if (route.requiresRole) {
      const user = this.getCurrentUser()
      if (!user || !this.hasRequiredRole(user, route.requiresRole)) {
        console.log('🚫 Недостаточно прав')
        Router.go('/access-denied')
        return false
      }
    }

    return true
  }

  isUserAuthenticated() {
    return window.__user_authenticated__ === true && this.getCurrentUser() !== null
  }

  getCurrentUser() {
    return window.__current_user__ || authService.getAdminData()
  }

  hasRequiredRole(user, requiredRole) {
    if (requiredRole === 'admin') {
      return user.isActive === true
    }
    if (requiredRole === 'super_admin') {
      return user.isSuperAdmin === true && user.isActive === true
    }
    return true
  }

  static restoreRouteAfterLogin() {
    const savedRoute = sessionStorage.getItem('redirect_after_login')
    sessionStorage.removeItem('redirect_after_login')

    if (savedRoute && savedRoute !== '#/login' && savedRoute !== '#/sign-in') {
      console.log('🔄 Восстанавливаем роут после входа:', savedRoute)
      location.hash = savedRoute
    } else {
      Router.go('/home')
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
    const hash = location.hash

    if (!this.cache.has(hash)) {
      for (const route of this.routes) {
        const regex = new RegExp(`^#!?${route.path}/?(?:\\?(.*))?$`)
        const matches = hash.match(regex)

        if (matches) {
          const searchParams = new URLSearchParams(new URL(location.href.replace('#/', '')).search)

          this.cache.set(hash, {
            route,
            params: { ...Object.fromEntries(searchParams.entries()), ...matches.groups }
          })
          break
        }
      }
    }

    return this.cache.get(hash)
  }
}