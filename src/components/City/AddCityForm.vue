<template>
  <form @submit.prevent="submit">
    <header>
      <h1>Добавить город</h1>
    </header>

    <main class="space-y-5">
      <FormRow>
        <template #label>Название <span class="text-red-500">*</span></template>
        <TextInput
            v-model="newCity.name"
            v-focus
            name="name"
            placeholder="Введите название города"
            required
            maxlength="100"
        />
      </FormRow>

      <FormRow>
        <template #label>Название (туркменский)</template>
        <TextInput
            v-model="newCity.nameTm"
            name="nameTm"
            placeholder="Введите название на туркменском"
            maxlength="100"
        />
      </FormRow>

      <FormRow>
        <template #label>Порядок отображения</template>
        <TextInput
            v-model.number="newCity.displayOrder"
            name="displayOrder"
            type="number"
            placeholder="0"
            min="0"
            max="999"
        />
        <template #help>Чем меньше число, тем выше в списке</template>
      </FormRow>
    </main>

    <footer>
      <BtnComponent class="BtnComponent-add" type="submit" :disabled="!isFormValid || isSubmitting">
        <span v-if="isSubmitting" class="spinner mr-2"></span>
        Сохранить
      </BtnComponent>
      <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose" :disabled="isSubmitting">
        Отмена
      </BtnComponent>
    </footer>
  </form>
</template>

<script>
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay } from '@/composables';
import { isEqual } from 'lodash';
import { mapActions } from 'vuex';
import { computed } from 'vue';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
  name: 'AddCityForm',

  components: {
    FormRow, TextInput, BtnComponent
  },

  setup() {
    const { showOverlay, hideOverlay } = useOverlay();
    const { toastSuccess } = useMessageToaster();
    const errorHandler = useErrorHandler('dialog');
    const { showConfirmDialog } = useDialogBox();

    return {
      showOverlay,
      hideOverlay,
      toastSuccess,
      errorHandler,
      showConfirmDialog
    };
  },

  data() {
    return {
      newCity: {
        name: '',
        nameTm: '',
        displayOrder: 0
      },
      isSubmitting: false
    };
  },

  computed: {
    isFormValid() {
      return this.newCity.name.trim().length >= 2;
    },

    hasChanges() {
      const emptyData = { name: '', nameTm: '', displayOrder: 0 };
      return !isEqual(this.newCity, emptyData);
    }
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    ...mapActions('cities', ['store']),

    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.maybeClose();
      }
    },

    async submit() {
      if (!this.isFormValid || this.isSubmitting) return;

      this.isSubmitting = true;
      this.showOverlay();

      try {
        const cityData = {
          name: this.newCity.name.trim(),
          name_tm: this.newCity.nameTm?.trim() || null,
          display_order: this.newCity.displayOrder || 0
        };

        await this.store(cityData);
        this.toastSuccess(`Город "${cityData.name}" успешно создан`);
        this.close();
      } catch (error) {
        this.errorHandler.handleHttpError(error);
      } finally {
        this.hideOverlay();
        this.isSubmitting = false;
      }
    },

    async maybeClose() {
      if (!this.hasChanges) {
        this.close();
        return;
      }

      if (await this.showConfirmDialog('Отменить создание города? Все изменения будут потеряны.')) {
        this.close();
      }
    },

    close() {
      this.$emit('close');
    }
  }
};
</script>