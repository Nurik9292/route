import { ref, watch } from 'vue'
import { forceReloadWindow } from '@/utils'
import { authService } from '@/services'
import { logger } from '@/utils'

export default class Router {
  constructor(routes) {
    console.log(routes)
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

    if (newHash && newHash !== '/' && newHash !== '/home' && newHash !== '/login' && newHash !== '#/home') {
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

    if (this.isResolving || window.__app_initializing__) {
      console.log('⏳ Роутер занят или приложение инициализируется')
      return
    }

    this.isResolving = true

    try {
      const currentPath = this.getCurrentPath()
      console.log('🔄 Обрабатываем роут:', currentPath)


      if (!location.hash || location.hash === '#/' || location.hash === '#!/') {
        return this.handleEmptyRoute()
      }


      const matched = this.tryMatchRoute()
      if (!matched) {
        return this.triggerNotFound()
      }

      const { route, params } = matched

      if (route.onResolve && (await route.onResolve(params)) === false) {
        return this.triggerNotFound()
      }


      if (route.redirect) {
        const to = route.redirect(params)
        return typeof to === 'string' ? Router.go(to) : this.activateRoute(to, params)
      }


      this.saveCurrentRoute()
      return this.activateRoute(route, params)

    } finally {
      this.isResolving = false
    }
  }

  handleEmptyRoute() {
    const savedRoute = sessionStorage.getItem('last_route')


    if (savedRoute && savedRoute !== '/home' && savedRoute !== '/' && savedRoute !== '/login') {
      console.log('🔄 Восстанавливаем сохраненный роут:', savedRoute)
      location.hash = `#${savedRoute}`
      return
    }


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

  isUserAuthenticated() {
    return this.getCurrentUser() !== null
  }

  getCurrentUser() {
    return  authService.getAdminData()
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