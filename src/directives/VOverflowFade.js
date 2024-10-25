import { useIntersectionObserver } from '@vueuse/core'

const toggleClasses = (el) => {
  el.classList.toggle('fade-top', el.scrollTop !== 0)
  el.classList.toggle('fade-bottom', el.scrollTop + el.clientHeight !== el.scrollHeight)
}

export default {
  mounted(el) {
    useIntersectionObserver(el, ([{ isIntersecting }]) => {
      if (isIntersecting) {
        toggleClasses(el);
      }
    });

    el.addEventListener('scroll', () => {
      requestAnimationFrame(() => toggleClasses(el));
    });
  },

  name: 'overflowFade'
}