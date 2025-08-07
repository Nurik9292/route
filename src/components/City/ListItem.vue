<template>
  <article
      :class="{ selected: item.selected }"
      class="highlight city-item group text-k-text-secondary border-b border-k-border !max-w-full h-[64px] flex
        items-center transition-[background-color,_box-shadow] ease-in-out duration-200
        focus:rounded-md focus focus-within:rounded-md focus:ring-inset focus:ring-1 focus:!ring-k-accent
        focus-within:ring-inset focus-within:ring-1 focus-within:!ring-k-accent
        hover:bg-white/5 hover:ring-inset hover:ring-1 hover:ring-white/10 hover:rounded-md"
      data-testid="city-item"
      tabindex="0"
  >
        <span class="track-number">
            <span class="text-k-text-secondary order-badge">
                {{ item.city.display_order || 0 }}
            </span>
        </span>

    <span class="title-city flex flex-col gap-1 overflow-hidden">
            <span class="title text-k-text-primary !flex gap-2 items-center font-medium">
                {{ item.city.name }}
                <span v-if="!item.city.is_active" class="status-badge inactive">
                    Неактивен
                </span>
            </span>
            <span class="subtitle text-k-text-secondary text-sm">
                {{ item.city.name_tm || 'Название на туркменском не указано' }}
            </span>
        </span>

    <span class="action">
            <div class="space-x-2">
                <BtnComponent highlight small @click="edit" :disabled="isProcessing">
                    <Icon :icon="['fas', 'pen-to-square']" class="mr-1" />
                    Изменить
                </BtnComponent>
                <BtnComponent danger small @click="destroy" :disabled="isProcessing">
                    <Icon :icon="['fas', 'trash']" class="mr-1" />
                    Удалить
                </BtnComponent>
            </div>
        </span>
  </article>
</template>

<script>
import { mapActions } from 'vuex';
import { eventBus } from '@/utils';
import { useDialogBox, useMessageToaster } from "@/composables";

import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
  name: 'ListItem',

  components: {
    BtnComponent,
  },

  props: {
    item: {
      type: Object,
      required: true
    }
  },

  setup() {
    const { showConfirmDialog } = useDialogBox();
    const { toastSuccess, toastError } = useMessageToaster();

    return {
      showConfirmDialog,
      toastSuccess,
      toastError
    };
  },

  data() {
    return {
      isProcessing: false
    };
  },

  methods: {
    ...mapActions('cities', {
      cityDestroy: 'destroy'
    }),

    async edit() {
      eventBus.emit('MODAL_SHOW_EDIT_CITY_FORM', this.item.city);
    },

    async destroy() {
      const confirmMessage = `Удалить город "${this.item.city.name}"?`;
      const confirmHint = this.item.city.isActive ?
          'Город будет деактивирован и скрыт из списка.' :
          'Это действие нельзя будет отменить.';

      if (!await this.showConfirmDialog(confirmMessage,  confirmHint )) {
        return;
      }

      this.isProcessing = true;

      try {
        await this.cityDestroy(this.item.city);
        this.toastSuccess(`Город "${this.item.city.name}" успешно удален`);
      } catch (error) {
        this.toastError('Ошибка при удалении города');
        console.error('Delete city error:', error);
      } finally {
        this.isProcessing = false;
      }
    }
  }
};
</script>

<style lang="postcss" scoped>
article {
  &.droppable {
    @apply relative transition-none after:absolute after:w-full after:h-[3px] after:rounded after:bg-k-success after:top-0;

    &.dragover-bottom {
      @apply after:top-auto after:bottom-0;
    }
  }

  &.selected {
    @apply bg-white/10;
  }

  &.highlight {
    .title, .track-number {
      @apply text-k-accent !important;
    }
  }

  .title-city {
    span {
      @apply overflow-hidden whitespace-nowrap text-ellipsis block;
    }
  }

  .order-badge {
    @apply inline-flex items-center justify-center w-8 h-8 text-xs font-medium bg-blue-100 text-blue-800 rounded-full;
  }

  .status-badge {
    @apply inline-flex items-center px-2 py-1 text-xs font-medium rounded-full;

    &.inactive {
      @apply bg-gray-100 text-gray-600;
    }
  }

  button {
    @apply text-current;
  }
}
</style>