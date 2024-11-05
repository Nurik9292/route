<template>
  <div class="slots-container">
    <div class="slot">
      <label for="slot1" class="slot-label">Label 1</label>
      <slot name="slot1"></slot>
      <span class="help-text">Help text for slot 1</span>
    </div>
    <div class="slot">
      <label for="slot2" class="slot-label">Label 2</label>
      <slot name="slot2"></slot>
      <span class="help-text">Help text for slot 2</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TwoSlotsWithLabels',
};
</script>

<style scoped>
.slots-container {
  display: flex; /* Используем Flexbox для размещения в ряд */
  justify-content: space-between; /* Разделяем пространство между слотами */
}

.slot {
  flex: 1; /* Каждый слот занимает равное пространство */
  margin-right: 16px; /* Отступ между слотами */
}

.slot:last-child {
  margin-right: 0; /* Убираем отступ у последнего слота */
}

.slot-label {
  display: block; /* Отображаем label как блочный элемент */
  margin-bottom: 4px; /* Отступ между label и слотом */
}

.help-text {
  display: block; /* Отображаем help как блочный элемент */
  margin-top: 4px; /* Отступ между слотом и help */
  font-size: 12px; /* Размер шрифта для help */
  color: #666; /* Цвет текста для help */
}
</style>
