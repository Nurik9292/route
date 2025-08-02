<template>
  <div class="text-input-wrapper">
    <input
        ref="el"
        v-model="value"
        :class="inputClasses"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :name="name"
        v-bind="$attrs"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        @input="$emit('input', $event)"
        @keydown="$emit('keydown', $event)"
        @keyup="$emit('keyup', $event)"
    />

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="hint" class="hint-message">
      {{ hint }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'TextInput',

  inheritAttrs: false,

  props: {
    modelValue: {
      type: [String, Number, Object],
      default: null
    },

    error: {
      type: String,
      default: null
    },

    hint: {
      type: String,
      default: null
    },

    type: {
      type: String,
      default: 'text'
    },

    placeholder: {
      type: String,
      default: ''
    },

    disabled: {
      type: Boolean,
      default: false
    },

    readonly: {
      type: Boolean,
      default: false
    },

    required: {
      type: Boolean,
      default: false
    },

    autocomplete: {
      type: String,
      default: 'off'
    },

    name: {
      type: String,
      default: ''
    }
  },

  emits: [
    'update:modelValue',
    'blur',
    'focus',
    'input',
    'keydown',
    'keyup'
  ],

  data() {
    return {
      el: null,
    };
  },

  computed: {
    value: {
      get() {
        return this.modelValue;
      },
      set(newValue) {
        this.$emit('update:modelValue', newValue);
      }
    },

    inputClasses() {
      return [
        'block text-base w-full px-4 py-2.5 rounded transition-colors duration-200',
        'bg-k-bg-input text-k-text-input',
        'border border-transparent',
        'focus:outline-none focus:ring-2 focus:ring-opacity-50',

        this.disabled ? 'bg-gray-400 text-gray-900 cursor-not-allowed' : '',
        this.readonly ? 'bg-gray-100 text-gray-700' : '',

        this.error ? [
          'border-red-500 bg-red-50 text-red-900',
          'focus:ring-red-500 focus:border-red-500'
        ] : [
          'focus:ring-blue-500 focus:border-blue-500',
          'hover:border-gray-300'
        ]
      ].flat().filter(Boolean).join(' ');
    }
  },

  mounted() {
    this.el = this.$refs.el;
  },

  methods: {
    focus() {
      this.$refs.el?.focus();
    },

    blur() {
      this.$refs.el?.blur();
    },

    select() {
      this.$refs.el?.select();
    }
  }
}
</script>

<style lang="postcss" scoped>
.text-input-wrapper {
  @apply w-full;
}

.error-message {
  @apply text-red-500 text-sm mt-1 font-medium;
}

.hint-message {
  @apply text-gray-500 text-sm mt-1;
}

.error-message,
.hint-message {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px var(--color-bg-input) inset !important;
  -webkit-text-fill-color: var(--color-text-input) !important;
}
</style>