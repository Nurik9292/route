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

    this.resolveDebounced = this.debounce(this.resolve.bind(this), 100)
    addEventListener('popstate', () => this.resolveDebounced(), true)

    setTimeout(() => {
      if (location.hash && location.hash !== '#/' && location.hash !== '#!/') {
        console.log('🚀 Автоматический resolve при инициализации:', location.hash)
        this.resolve()
      }
    }, 50)
  }

  static go(path, reload = false) {
    if (typeof path === 'number') {
      history.go(path)
      return
    }

    if (!path.startsWith('/')) path = `/${path}`
    if (!path.startsWith('/#')) path = `/#${path}`

    const newHash = path.substring(1)

    console.log(`🧭 Router.go: ${path} (reload: ${reload})`)

    if (newHash && Router.isValidRouteStatic(newHash)) {
      sessionStorage.setItem('last_route', newHash)
      console.log('💾 Сохраняем роут в go():', newHash)
    }

    if (reload) {
      location.assign(`${location.origin}${location.pathname}${newHash}`)
      forceReloadWindow()
    } else {
      location.hash = newHash
    }
  }

  static isValidRouteStatic(path) {
    if (!path) return false

    const excludedRoutes = ['/', '/home', '/login', '/sign-in', '/404']
    if (excludedRoutes.includes(path)) return false

    const validRoutes = ['/routes', '/stops', '/admins', '/cities', '/profile', '/banners']
    return validRoutes.some(route => path.startsWith(route))
  }

  async resolve() {
    if (this.isResolving || window.__app_initializing__) {
      console.log('⏳ Роутер занят или приложение инициализируется')
      return
    }

    this.isResolving = true

    try {
      const currentPath = this.getCurrentPath()
      const currentHash = location.hash

      console.log('🔄 Обрабатываем роут:', currentPath, 'Hash:', currentHash)

      if (!currentHash || currentHash === '#/' || currentHash === '#!/') {
        console.log('📍 Пустой hash, обрабатываем как empty route')
        return this.handleEmptyRoute()
      }

      const matched = this.tryMatchRoute()
      if (!matched) {
        console.log('❌ Роут не найден для:', currentHash)

        const savedRoute = sessionStorage.getItem('last_route')
        if (savedRoute && savedRoute !== currentPath && this.isValidRoute(savedRoute)) {
          console.log('🔄 Роут не найден, пробуем восстановить сохраненный:', savedRoute)
          Router.go(savedRoute)
          return
        }

        return this.triggerNotFound()
      }

      const { route, params } = matched
      console.log('✅ Найден роут:', route.screen, 'Params:', params)

      if (route.onResolve && (await route.onResolve(params)) === false) {
        console.log('❌ onResolve вернул false')
        return this.triggerNotFound()
      }

      if (route.redirect) {
        console.log('🔀 Редирект из:', route.path)
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
    console.log('🏠 Обрабатываем пустой роут')

    const savedRoute = sessionStorage.getItem('last_route')

    if (savedRoute && this.isValidRoute(savedRoute)) {
      console.log('🔄 Восстанавливаем сохраненный роут:', savedRoute)
      location.hash = `#${savedRoute}`
      return
    }

    console.log('🏠 Переход на главную (нет валидного сохраненного роута)')
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

    if (this.isValidRoute(currentPath)) {
      sessionStorage.setItem('last_route', currentPath)
      console.log('💾 Сохранили текущий роут:', currentPath)
    }
  }

  isValidRoute(path) {
    if (!path) return false

    const excludedRoutes = ['/', '/home', '/login', '/sign-in', '/404']
    if (excludedRoutes.includes(path)) return false

    const routeExists = this.routes.some(route => {
      const regex = new RegExp(`^${route.path}/?(?:\\?(.*))?$`)
      return regex.test(path)
    })

    console.log('🔍 Проверка валидности роута:', path, '→', routeExists)
    return routeExists
  }

  isUserAuthenticated() {
    return this.getCurrentUser() !== null
  }

  getCurrentUser() {
    return authService.getAdminData()
  }

  async triggerNotFound() {
    console.log('❌ Активируем 404')
    return this.activateRoute(this.notFoundRoute)
  }

  onRouteChanged(handler) {
    this.routeChangedHandlers.push(handler)
  }

  async activateRoute(route, params = {}) {
    console.log('🎯 Активируем роут:', route?.screen || 'unknown', 'с параметрами:', params)

    this.$currentRoute.value = {
      ...route,
      params: { ...params }
    }

    console.log('✅ Роут активирован:', this.$currentRoute.value)
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

  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
}