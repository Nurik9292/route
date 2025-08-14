<template>
  <div class="trip-planner">
    <div class="planner-header">
      <h3 class="planner-title">Планировщик поездок</h3>
      <p class="planner-subtitle">Найдите оптимальный маршрут между двумя точками</p>
    </div>

    <!-- Переключатель режимов -->
    <div class="mode-selector">
      <button
          @click="inputMode = 'text'"
          :class="['mode-button', { active: inputMode === 'text' }]"
          type="button"
      >
        <Icon :icon="['fas', 'keyboard']" class="mode-icon" />
        <span>Ввод адреса</span>
      </button>
      <button
          @click="inputMode = 'map'"
          :class="['mode-button', { active: inputMode === 'map' }]"
          type="button"
      >
        <Icon :icon="['fas', 'map-marker-alt']" class="mode-icon" />
        <span>Выбор на карте</span>
      </button>
    </div>

    <!-- РЕЖИМ ВВОДА ТЕКСТА -->
    <form v-if="inputMode === 'text'" @submit.prevent="searchTrips" class="search-form">
      <div class="input-group">
        <label class="input-label">
          <Icon :icon="['fas', 'location-arrow']" class="label-icon start-icon" />
          Откуда
        </label>
        <TextInput
            v-model="tripForm.fromText"
            type="text"
            placeholder="Укажите точку отправления"
            class="location-input"
        />
      </div>

      <div class="input-group">
        <label class="input-label">
          <Icon :icon="['fas', 'map-pin']" class="label-icon end-icon" />
          Куда
        </label>
        <TextInput
            v-model="tripForm.toText"
            type="text"
            placeholder="Укажите пункт назначения"
            class="location-input"
        />
      </div>

      <BtnComponent
          type="submit"
          blue
          block
          :disabled="!tripForm.fromText || !tripForm.toText"
          :loading="tripSearchLoading"
          class="search-button"
      >
        <Icon :icon="['fas', 'route']" class="mr-2" />
        Найти маршрут
      </BtnComponent>
    </form>

    <!-- РЕЖИМ ВЫБОРА НА КАРТЕ -->
    <div v-else class="map-mode">
      <!-- Инструкция -->
      <div class="instruction-card">
        <div class="instruction-header">
          <Icon :icon="['fas', 'info-circle']" class="instruction-icon" />
          <span class="instruction-title">Как выбрать точки на карте</span>
        </div>
        <ol class="instruction-list">
          <li>Кликните на карте для выбора точки "Откуда"</li>
          <li>Кликните еще раз для выбора точки "Куда"</li>
          <li>Нажмите "Найти маршрут" для поиска</li>
        </ol>
      </div>

      <!-- Выбранные точки -->
      <div class="points-display">
        <div class="point-card from-point">
          <div class="point-indicator start-point"></div>
          <div class="point-info">
            <div class="point-label">Откуда</div>
            <div class="point-coordinates">
              {{ tripForm.from ? formatCoordinates(tripForm.from) : 'Кликните на карте для выбора' }}
            </div>
          </div>
          <button
              v-if="tripForm.from"
              @click="clearFromPoint"
              class="clear-point-button"
              type="button"
          >
            <Icon :icon="['fas', 'times']" />
          </button>
        </div>

        <div class="point-card to-point">
          <div class="point-indicator end-point"></div>
          <div class="point-info">
            <div class="point-label">Куда</div>
            <div class="point-coordinates">
              {{ tripForm.to ? formatCoordinates(tripForm.to) : 'Кликните на карте для выбора' }}
            </div>
          </div>
          <button
              v-if="tripForm.to"
              @click="clearToPoint"
              class="clear-point-button"
              type="button"
          >
            <Icon :icon="['fas', 'times']" />
          </button>
        </div>
      </div>

      <!-- Кнопки управления -->
      <div class="map-actions">
        <BtnComponent
            @click="clearAllPoints"
            white
            class="action-button"
            :disabled="!tripForm.from && !tripForm.to"
        >
          <Icon :icon="['fas', 'trash']" class="mr-2" />
          Очистить
        </BtnComponent>

        <BtnComponent
            @click="searchTrips"
            blue
            class="action-button primary"
            :disabled="!tripForm.from || !tripForm.to"
            :loading="tripSearchLoading"
        >
          <Icon :icon="['fas', 'route']" class="mr-2" />
          Найти маршрут
        </BtnComponent>
      </div>
    </div>

    <!-- Результаты поиска -->
    <div v-if="tripResults.length" class="results-section">
      <div class="results-header">
        <h4 class="results-title">
          Найденные варианты
          <span class="results-count">({{ tripResults.length }})</span>
        </h4>
      </div>

      <div class="results-list">
        <div
            v-for="(option, index) in tripResults"
            :key="index"
            @click="selectTripOption(option, index)"
            :class="['result-item', { selected: selectedOptionIndex === index }]"
        >
          <div class="result-header">
            <div class="trip-type">
              <Icon :icon="getTripTypeIcon(option.type)" class="trip-icon" />
              <span class="trip-label">{{ getTripTypeLabel(option.type) }}</span>
            </div>
            <div class="trip-duration">{{ option.total_duration }}м</div>
          </div>

          <div class="result-details">
            <div class="route-description">{{ getRouteDescription(option.route_segments) }}</div>
            <div v-if="option.transfers_count > 0" class="transfers-info">
              <Icon :icon="['fas', 'exchange-alt']" class="transfer-icon" />
              {{ option.transfers_count }} пересадка{{ option.transfers_count > 1 ? 'и' : 'а' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Состояние "Ничего не найдено" -->
    <div v-else-if="searchCompleted && !tripSearchLoading" class="empty-state">
      <Icon :icon="['fas', 'search']" class="empty-icon" />
      <div class="empty-title">Маршруты не найдены</div>
      <div class="empty-subtitle">Попробуйте изменить точки поиска или увеличить радиус</div>
    </div>

    <!-- Ошибка поиска -->
    <div v-if="searchError" class="error-state">
      <Icon :icon="['fas', 'exclamation-triangle']" class="error-icon" />
      <div class="error-message">{{ searchError }}</div>
    </div>
  </div>
</template>

<script>
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue'
import { monitoringAPI} from "@/api/index.js";
import { logger } from '@/utils/index.js'
import TextInput from "@/components/Ui/Form/TextInput.vue";

export default {
  name: 'TripPlanner',

  components: {
    TextInput,
    BtnComponent,
  },

  emits: [
    'trip-searched',
    'trip-option-selected',
    'map-click-mode-changed',
    'clear-trip-points'
  ],

  data() {
    return {
      inputMode: 'map', // 'text' или 'map'
      tripForm: {
        fromText: '',
        toText: '',
        from: null, // { lat, lng }
        to: null    // { lat, lng }
      },
      tripResults: [],
      tripSearchLoading: false,
      searchCompleted: false,
      searchError: null,
      selectedOptionIndex: null
    }
  },

  watch: {
    inputMode(newMode) {
      this.$emit('map-click-mode-changed', newMode === 'map')

      if (newMode === 'map') {
        this.tripForm.fromText = ''
        this.tripForm.toText = ''
      } else {
        this.clearAllPoints()
      }
    }
  },

  mounted() {
    this.$emit('map-click-mode-changed', true)
  },

  methods: {
    onMapClick(coordinates) {
      if (this.inputMode !== 'map') return

      if (!this.tripForm.from) {
        this.tripForm.from = coordinates
        logger.info('✅ Выбрана точка отправления:', coordinates)
      } else if (!this.tripForm.to) {
        this.tripForm.to = coordinates
        logger.info('✅ Выбрана точка назначения:', coordinates)
      } else {
        this.tripForm.to = coordinates
        logger.info('🔄 Изменена точка назначения:', coordinates)
      }
    },

    async searchTrips() {
      let searchParams

      if (this.inputMode === 'text') {
        if (!this.tripForm.fromText || !this.tripForm.toText) return
        searchParams = {
          origin: { address: this.tripForm.fromText },
          destination: { address: this.tripForm.toText }
        }
      } else {
        if (!this.tripForm.from || !this.tripForm.to) return
        searchParams = {
          from: {
            lat: this.tripForm.from.lat,
            lon: this.tripForm.from.lng
          },
          to: {
            lat: this.tripForm.to.lat,
            lon: this.tripForm.to.lng
          }
        }
      }

      this.tripSearchLoading = true
      this.searchError = null
      this.searchCompleted = false

      try {
        logger.info('🔍 Поиск маршрутов:', searchParams)
        const response = await monitoringAPI.search(searchParams)

        this.tripResults = response.trip_options || []
        this.searchCompleted = true
        this.selectedOptionIndex = null

        this.$emit('trip-searched', this.tripResults)

        if (this.tripResults.length === 0) {
          logger.info('❌ Маршруты не найдены для:', searchParams)
        } else {
          logger.info('✅ Найдено маршрутов:', this.tripResults.length)
        }

      } catch (error) {
        logger.error('❌ Ошибка поиска поездок:', error)
        this.searchError = 'Ошибка при поиске маршрутов. Попробуйте еще раз.'
        this.tripResults = []
      } finally {
        this.tripSearchLoading = false
      }
    },

    selectTripOption(option, index) {
      this.selectedOptionIndex = index
      this.$emit('trip-option-selected', option)
      logger.info('✅ Выбран вариант поездки:', option.type)
    },

    clearFromPoint() {
      this.tripForm.from = null
      this.$emit('clear-trip-points', 'from')
    },

    clearToPoint() {
      this.tripForm.to = null
      this.$emit('clear-trip-points', 'to')
    },

    clearAllPoints() {
      this.tripForm.from = null
      this.tripForm.to = null
      this.tripResults = []
      this.searchCompleted = false
      this.selectedOptionIndex = null
      this.$emit('clear-trip-points', 'all')
    },

    getTripTypeLabel(type) {
      const labels = {
        'direct': 'Прямой маршрут',
        'one_transfer': 'С пересадкой',
        'two_transfers': 'С 2 пересадками',
        'walking': 'Пешком'
      }
      return labels[type] || 'Смешанный'
    },

    getTripTypeIcon(type) {
      const icons = {
        'direct': ['fas', 'route'],
        'one_transfer': ['fas', 'exchange-alt'],
        'two_transfers': ['fas', 'random'],
        'walking': ['fas', 'walking']
      }
      return icons[type] || ['fas', 'route']
    },

    getRouteDescription(segments) {
      if (!segments || segments.length === 0) return 'Нет данных'

      return segments
          .map(segment => {
            if (segment.type === 'walking') return 'Пешком'
            return segment.route_number ? `№${segment.route_number}` : 'Автобус'
          })
          .join(' → ')
    },

    formatCoordinates(point) {
      return `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`
    }
  }
}
</script>

<style lang="postcss" scoped>
.trip-planner {
  @apply space-y-6;
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 1.5rem;
}

/* ========== HEADER ========== */
.planner-header {
  @apply space-y-1;
}

.planner-title {
  @apply text-lg font-semibold;
  color: var(--color-text-primary);
}

.planner-subtitle {
  @apply text-sm;
  color: var(--color-text-secondary);
}

/* ========== MODE SELECTOR ========== */
.mode-selector {
  @apply flex rounded-lg p-1;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
}

.mode-button {
  @apply flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200;
  color: var(--color-text-secondary);
}

.mode-button.active {
  @apply shadow-sm;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.mode-button:hover:not(.active) {
  color: var(--color-text-primary);
}

.mode-icon {
  @apply text-sm;
}

/* ========== SEARCH FORM ========== */
.search-form {
  @apply space-y-4;
}

.input-group {
  @apply space-y-2;
}

.input-label {
  @apply flex items-center gap-2 text-sm font-medium;
  color: var(--color-text-secondary);
}

.label-icon {
  @apply text-sm;
}

.start-icon {
  color: #10b981;
}

.end-icon {
  color: #ef4444;
}

.location-input {
  @apply w-full px-3 py-2 rounded-lg border transition-colors;
  background-color: var(--color-bg-primary);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.location-input:focus {
  @apply outline-none ring-2;
  ring-color: var(--color-accent);
  border-color: var(--color-accent);
}

.search-button {
  @apply font-medium;
}

/* ========== MAP MODE ========== */
.map-mode {
  @apply space-y-4;
}

.instruction-card {
  @apply p-4 rounded-lg border;
  background-color: color-mix(in srgb, var(--color-accent) 5%, var(--color-bg-primary));
  border-color: color-mix(in srgb, var(--color-accent) 20%, var(--color-border));
}

.instruction-header {
  @apply flex items-center gap-2 mb-3;
}

.instruction-icon {
  @apply text-lg;
  color: var(--color-accent);
}

.instruction-title {
  @apply font-medium;
  color: var(--color-text-primary);
}

.instruction-list {
  @apply space-y-1 text-sm pl-4;
  color: var(--color-text-secondary);
  list-style: decimal;
}

/* ========== POINTS DISPLAY ========== */
.points-display {
  @apply space-y-3;
}

.point-card {
  @apply flex items-center gap-3 p-4 rounded-lg border transition-colors;
  background-color: var(--color-bg-primary);
  border-color: var(--color-border);
}

.point-card:hover {
  border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
}

.point-indicator {
  @apply w-3 h-3 rounded-full flex-shrink-0;
}

.start-point {
  background-color: #10b981;
}

.end-point {
  background-color: #ef4444;
}

.point-info {
  @apply flex-1 min-w-0;
}

.point-label {
  @apply text-sm font-medium;
  color: var(--color-text-primary);
}

.point-coordinates {
  @apply text-xs font-mono mt-1;
  color: var(--color-text-secondary);
}

.clear-point-button {
  @apply w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0;
  color: var(--color-text-secondary);
  background-color: color-mix(in srgb, var(--color-danger) 10%, transparent);
}

.clear-point-button:hover {
  color: var(--color-danger);
  background-color: color-mix(in srgb, var(--color-danger) 20%, transparent);
}

/* ========== MAP ACTIONS ========== */
.map-actions {
  @apply flex gap-3;
}

.action-button {
  @apply flex-1;
}

.action-button.primary {
  @apply font-medium;
}

/* ========== RESULTS SECTION ========== */
.results-section {
  @apply space-y-3;
}

.results-header {
  @apply flex items-center justify-between;
}

.results-title {
  @apply text-sm font-medium;
  color: var(--color-text-primary);
}

.results-count {
  @apply font-normal;
  color: var(--color-text-secondary);
}

.results-list {
  @apply space-y-2 max-h-60 overflow-y-auto;
}

.result-item {
  @apply p-4 rounded-lg border cursor-pointer transition-all duration-200;
  background-color: var(--color-bg-primary);
  border-color: var(--color-border);
}

.result-item:hover {
  border-color: var(--color-accent);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.result-item.selected {
  border-color: var(--color-accent);
  background-color: color-mix(in srgb, var(--color-accent) 5%, var(--color-bg-primary));
}

.result-header {
  @apply flex items-center justify-between mb-2;
}

.trip-type {
  @apply flex items-center gap-2;
}

.trip-icon {
  @apply text-sm;
  color: var(--color-accent);
}

.trip-label {
  @apply text-sm font-medium;
  color: var(--color-text-primary);
}

.trip-duration {
  @apply text-sm font-semibold px-2 py-1 rounded;
  background-color: var(--color-accent);
  color: white;
}

.result-details {
  @apply space-y-1;
}

.route-description {
  @apply text-xs;
  color: var(--color-text-secondary);
}

.transfers-info {
  @apply flex items-center gap-1 text-xs;
  color: #f59e0b;
}

.transfer-icon {
  @apply text-xs;
}

/* ========== EMPTY & ERROR STATES ========== */
.empty-state,
.error-state {
  @apply flex flex-col items-center text-center py-8 space-y-2;
}

.empty-icon,
.error-icon {
  @apply text-2xl mb-2;
  color: var(--color-text-secondary);
}

.error-icon {
  color: var(--color-danger);
}

.empty-title {
  @apply text-sm font-medium;
  color: var(--color-text-primary);
}

.empty-subtitle,
.error-message {
  @apply text-xs;
  color: var(--color-text-secondary);
}

.error-message {
  @apply p-3 rounded-lg;
  background-color: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
}

/* ========== SCROLLBAR ========== */
.results-list::-webkit-scrollbar {
  width: 4px;
}

.results-list::-webkit-scrollbar-track {
  background-color: var(--color-bg-secondary);
}

.results-list::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 2px;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-secondary);
}
</style>