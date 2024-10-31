<template>
    <slot />
  </template>
  
  <script>
  import { onKeyStroke as baseOnKeyStroke } from '@vueuse/core';
  import { eventBus } from '@/utils';
  import { useRouter } from '@/composables';
  
  export default {
    name: 'HotkeyListener',

    data() {
      return {
        router: useRouter()
      }
    },

    mounted() {
        const { isCurrentScreen, go } = this.router
  
        const onKeyStroke = (key, callback) => {
            baseOnKeyStroke(key, e => {
                if (e.altKey || e.ctrlKey || e.metaKey) return;
  
                if (
                    e.target instanceof HTMLInputElement ||
                    e.target instanceof HTMLTextAreaElement ||
                    e.target instanceof HTMLButtonElement
                ) return;
  
                const role = e.target.getAttribute('role');

                if (role === 'button' || role === 'checkbox') return;
  
                e.preventDefault();
                callback(e);
            });
        };
  
        onKeyStroke('f', () => eventBus.emit('FOCUS_SEARCH_FIELD'));
        onKeyStroke('q', () => go(isCurrentScreen('Queue') ? -1 : 'queue'));
        onKeyStroke('h', () => go('home'));
  
  
  
        onKeyStroke('l', () => {
            if (!queueStore.current) return;
            favoriteStore.toggleOne(queueStore.current);
            socketService.broadcast('SOCKET_SONG', queueStore.current);
        });
    }
  }
  </script>
  