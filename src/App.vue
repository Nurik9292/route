<template>
  <OverlayComponent ref="overlay" />
  <DialogBox ref="dialog" />
  <MessageToaster ref="toaster" />
  <GlobalEventListeners />

  <main v-if="layout === 'main' && initialized"
    class="absolute md:relative top-0 h-full md:h-screen pt-k-header-height md:pt-0 w-full md:w-auto flex flex-col justify-end"
    @dragend="onDragEnd" @dragleave="onDragLeave" @dragover="onDragOver" @drop="onDrop">
    <HotkeyListener />
    <MainWrapper />
  </main>

  <LoginForm v-if="layout === 'auth'" @loggedin="onUserLoggedIn" />

  <AppInitializer v-if="authenticated" @error="onInitError" @success="onInitSuccess" />
</template>

<script>
import { defineAsyncComponent, computed } from 'vue';
import { useRouter } from './composables';
import { authService } from './services';
import { MessageToasterKey, OverlayKey, DialogBoxKey } from './symbols';

import OverlayComponent from './components/Ui/OverlayComponent.vue';
import DialogBox from './components/Ui/DialogBox.vue';
import MessageToaster from './components/Ui/Toaster/MessageToaster.vue';
import GlobalEventListeners from './components/Utils/GlobalEventListeners.vue';
import AppInitializer from './components/Utils/AppInitializer.vue';

export default {
  components: {
    OverlayComponent,
    DialogBox,
    MessageToaster,
    HotkeyListener: defineAsyncComponent(() => import('./components/Utils/HotkeyListener.vue')),
    LoginForm: defineAsyncComponent(() => import('./components/Auth/LoginForm.vue')),
    MainWrapper: defineAsyncComponent(() => import('./components/MainWrapper/MainWrapper.vue')),
    GlobalEventListeners,
    AppInitializer
  },

  data() {
    return {
      overlay: null,
      dialog: null,
      toaster: null,
      // online: useOnline(),
      authenticated: false,
      initialized: false,
      layout: 'auth',
      showDropZone: false,
    };
  },


  mounted() {
    this.initializeApp();
  },

  methods: {
    async initializeApp() {
      if (window.AUTH_TOKEN) {
        authService.setTokensUsingCompositeToken(window.AUTH_TOKEN);
      }

      if (authService.hasApiToken()) {
        this.triggerAppInitialization();
        return;
      }

      await this.resolveRoute().then(() => {
        switch (this.getCurrentScreen()) {
          default:
            this.layout = 'auth';
        }
        document.documentElement.classList.add(
          navigator.userAgent.includes('Mac') ? 'mac' : 'non-mac'
        );
      });
    },

  
    triggerAppInitialization() {
      this.authenticated = true;
    },

    onUserLoggedIn() {
      this.layout = 'main';
      this.triggerAppInitialization();
    },

    async onInitSuccess() {
      this.authenticated = false;
      this.initialized = true;
      await this.resolveRoute();
      this.layout = 'main';
    },

    onInitError() {
      this.authenticated = false;
      this.layout = 'auth';
    },

    onDragOver(e) {
      this.showDropZone = e.dataTransfer?.types.includes('Files') && !this.isCurrentScreen('Upload');
    },

    onDragEnd() {
      this.showDropZone = false;
    },

    onDragLeave(e) {
      if (e.currentTarget.contains(e.relatedTarget)) return;
      this.showDropZone = false;
    },

    onDrop() {
      this.showDropZone = false;
    },

    async resolveRoute() {
      const { resolveRoute } = useRouter();
      return await resolveRoute();
    },

    getCurrentScreen() {
      const { getCurrentScreen } = useRouter();
      return getCurrentScreen();
    },

    isCurrentScreen(screen) {
      const { isCurrentScreen } = useRouter();
      return isCurrentScreen(screen);
    }
  },

  provide() {
    return {
      [OverlayKey]: computed(() => this.$refs.overlay),
      [DialogBoxKey]: computed(() => this.$refs.dialog),
      [MessageToasterKey]: computed(() => this.$refs.toaster)
    };
  },

};
</script>

<style lang="postcss">
#dragGhost {
  @apply inline-block py-2 pl-8 pr-3 rounded-md text-base font-sans fixed top-0 left-0 z-[-1] bg-k-success text-k-text-primary no-hover:hidden;
}

#copyArea {
  @apply absolute -left-full bottom-px w-px h-px no-hover:hidden;
}
</style>
