// src/components/Ui/ModalWrapper.vue
<template>
  <dialog ref="dialog"
          class="text-k-text-primary min-w-full md:min-w-[480px] border-0 p-0 rounded-md bg-k-bg-primary overflow-visible backdrop:bg-black/70"
          @cancel.prevent>
    <component :is="modalNameToComponentMap[activeModalName]" v-if="activeModalName" @close="close" @success="onSuccess" />
  </dialog>
</template>

<script>
import { defineAsyncComponent, computed, watch } from 'vue';
import { eventBus, provideReadonly } from '@/utils';
import { ModalContextKey } from '@/symbols';

export default {
  name: 'ModalWrapper',

  data() {
    return {
      modalNameToComponentMap: {
        'add-user-form': defineAsyncComponent(() => import('@/components/Admin/AdminAddForm.vue')),
        'edit-user-form': defineAsyncComponent(() => import('@/components/Admin/AdminEditForm.vue')),

        'add-stop-form': defineAsyncComponent(() => import('../Stops/AddStopForm.vue')),
        'edit-stop-form': defineAsyncComponent(() => import('../Stops/EditStopForm.vue')),
        'add-route-form': defineAsyncComponent(() => import('../Routes/AddRouteForm.vue')),
        'edit-route-form': defineAsyncComponent(() => import('../Routes/EditRouteForm.vue')),
        'add-city-form': defineAsyncComponent(() => import('../City/AddCityForm.vue')),
        'edit-city-form': defineAsyncComponent(() => import('../City/EditCityForm.vue')),
        'add-banner-form': defineAsyncComponent(() => import('../Banners/AddBannerForm.vue')),
      },
      activeModalName: null,
      context: {},
    };
  },

  mounted() {
    provideReadonly(ModalContextKey, computed(() => this.context));

    watch(
        () => this.activeModalName,
        (name) => (name ? this.$refs.dialog.showModal() : this.$refs.dialog.close())
    );

    eventBus.on('MODAL_SHOW_ADD_USER_FORM', () => {
      this.context = {};
      this.activeModalName = 'add-user-form';
    });

    eventBus.on('MODAL_SHOW_EDIT_USER_FORM', (admin) => {
      this.context = { admin };
      this.activeModalName = 'edit-user-form';
    });

    eventBus.on('MODAL_SHOW_ADD_STOP_FORM', () => (this.activeModalName = 'add-stop-form'));
    eventBus.on('MODAL_SHOW_ADD_ROUTE_FORM', () => (this.activeModalName = 'add-route-form'));
    eventBus.on('MODAL_SHOW_ADD_CITY_FORM', () => (this.activeModalName = 'add-city-form'));
    eventBus.on('MODAL_SHOW_ADD_BANNER_FORM', () => (this.activeModalName = 'add-banner-form'));

    eventBus.on('MODAL_SHOW_EDIT_STOP_FORM', (stop) => {
      this.context = { stop };
      this.activeModalName = 'edit-stop-form';
    });
    eventBus.on('MODAL_SHOW_EDIT_ROUTE_FORM', (route) => {
      this.context = { route };
      this.activeModalName = 'edit-route-form';
    });
    eventBus.on('MODAL_SHOW_EDIT_CITY_FORM', (city) => {
      this.context = { city };
      this.activeModalName = 'edit-city-form';
    });
  },

  beforeUnmount() {
    eventBus.off('MODAL_SHOW_ADD_USER_FORM');
    eventBus.off('MODAL_SHOW_EDIT_USER_FORM');
    eventBus.off('MODAL_SHOW_ADD_STOP_FORM');
    eventBus.off('MODAL_SHOW_ADD_ROUTE_FORM');
    eventBus.off('MODAL_SHOW_ADD_CITY_FORM');
    eventBus.off('MODAL_SHOW_ADD_BANNER_FORM');
    eventBus.off('MODAL_SHOW_EDIT_STOP_FORM');
    eventBus.off('MODAL_SHOW_EDIT_ROUTE_FORM');
    eventBus.off('MODAL_SHOW_EDIT_CITY_FORM');
  },

  methods: {
    close() {
      this.activeModalName = null;
      this.context = {};
    },

    onSuccess() {
      this.close();
      // Можно добавить дополнительную логику, например:
      // - показать toast сообщение
      // - обновить данные в родительском компоненте
      // - логирование
    }
  },
};
</script>

<style lang="postcss" scoped>
dialog {
  :deep(form),
  :deep(>div) {
    @apply relative;

    >header,
    >main,
    >footer {
      @apply px-6 py-5;
    }

    >footer {
      @apply mt-0 bg-black/10 border-t border-white/5 space-x-2;
    }

    >header {
      @apply flex bg-k-bg-secondary;

      h1 {
        @apply text-3xl leading-normal overflow-hidden text-ellipsis whitespace-nowrap;
      }
    }
  }
}
</style>