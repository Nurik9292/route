import { ref, watch } from 'vue'
import { forceReloadWindow } from '@/utils'

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
      history.go(path)
      return
    }

    if (!path.startsWith('/')) {
      path = `/${path}`
    }

    if (!path.startsWith('/#')) {
      path = `/#${path}`
    }

    path = path.substring(1)
    location.assign(`${location.origin}${location.pathname}${path}`)

    if (reload) {
      forceReloadWindow()
    }
  }

  async resolve() {
    if (!location.hash || location.hash === '#/' || location.hash === '#!/') {
      return Router.go(this.homeRoute.path)
    }

    const matched = this.tryMatchRoute()
    const [route, params] = matched ? [matched.route, matched.params] : [null, null]

    if (!route) {
      return this.triggerNotFound()
    }

    if ((await route.onResolve?.(params)) === false) {
      return this.triggerNotFound()
    }

    if (route.redirect) {
      const to = route.redirect(params)
      return typeof to === 'string' ? Router.go(to) : this.activateRoute(to, params)
    }

    return this.activateRoute(route, params)
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
