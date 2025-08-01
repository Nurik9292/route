<template>
  <nav v-if="totalPages > 1" class="pagination flex items-center justify-between">
    <div class="pagination-info text-sm text-k-text-secondary">
      Показано {{ startItem }}-{{ endItem }} из {{ totalItems }}
    </div>

    <div class="pagination-nav flex items-center space-x-1">
      <button
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
          class="pagination-btn"
          :class="{ disabled: currentPage <= 1 }"
      >
        <Icon :icon="['fas', 'angle-left']" />
        Назад
      </button>

      <div class="flex items-center space-x-1">
        <button
            v-if="showFirstPage"
            @click="goToPage(1)"
            class="pagination-btn page-btn"
            :class="{ active: currentPage === 1 }"
        >
          1
        </button>

        <span v-if="showStartEllipsis" class="pagination-ellipsis">...</span>

        <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            class="pagination-btn page-btn"
            :class="{ active: currentPage === page }"
        >
          {{ page }}
        </button>

        <span v-if="showEndEllipsis" class="pagination-ellipsis">...</span>

        <button
            v-if="showLastPage"
            @click="goToPage(totalPages)"
            class="pagination-btn page-btn"
            :class="{ active: currentPage === totalPages }"
        >
          {{ totalPages }}
        </button>
      </div>

      <button
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
          class="pagination-btn"
          :class="{ disabled: currentPage >= totalPages }"
      >
        Вперед
        <Icon :icon="['fas', 'angle-right']" />
      </button>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Pagination',

  props: {
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    },
    totalItems: {
      type: Number,
      required: true
    },
    itemsPerPage: {
      type: Number,
      default: 20
    },
    maxVisiblePages: {
      type: Number,
      default: 5
    }
  },

  emits: ['page-changed'],

  computed: {
    startItem() {
      return (this.currentPage - 1) * this.itemsPerPage + 1;
    },

    endItem() {
      const end = this.currentPage * this.itemsPerPage;
      return Math.min(end, this.totalItems);
    },

    visiblePages() {
      const pages = [];
      const half = Math.floor(this.maxVisiblePages / 2);

      let start = Math.max(1, this.currentPage - half);
      let end = Math.min(this.totalPages, this.currentPage + half);

      if (end - start + 1 < this.maxVisiblePages) {
        if (start === 1) {
          end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);
        } else if (end === this.totalPages) {
          start = Math.max(1, end - this.maxVisiblePages + 1);
        }
      }

      if (this.showFirstPage && start <= 2) {
        start = 2;
      }
      if (this.showLastPage && end >= this.totalPages - 1) {
        end = this.totalPages - 1;
      }

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== this.totalPages) {
          pages.push(i);
        }
      }

      return pages;
    },

    showFirstPage() {
      return this.totalPages > this.maxVisiblePages && this.currentPage > Math.floor(this.maxVisiblePages / 2) + 1;
    },

    showLastPage() {
      return this.totalPages > this.maxVisiblePages &&
          this.currentPage < this.totalPages - Math.floor(this.maxVisiblePages / 2);
    },

    showStartEllipsis() {
      return this.showFirstPage && this.visiblePages.length > 0 && this.visiblePages[0] > 2;
    },

    showEndEllipsis() {
      return this.showLastPage && this.visiblePages.length > 0 &&
          this.visiblePages[this.visiblePages.length - 1] < this.totalPages - 1;
    }
  },

  methods: {
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.$emit('page-changed', page);
      }
    }
  }
};
</script>

<style lang="postcss" scoped>
.pagination {
  @apply py-4;
}

.pagination-info {
  @apply text-sm text-k-text-secondary;
}

.pagination-nav {
  @apply flex items-center space-x-1;
}

.pagination-btn {
  @apply px-3 py-2 text-sm border border-k-bg-secondary rounded-md
  hover:bg-k-bg-secondary transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-k-accent focus:ring-opacity-50;
}

.pagination-btn:not(.disabled):not(.active) {
  @apply text-k-text-primary hover:text-k-text-primary;
}

.pagination-btn.active {
  @apply bg-k-accent text-white border-k-accent;
}

.pagination-btn.disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-transparent;
}

.page-btn {
  @apply w-10 h-10 flex items-center justify-center p-0;
}

.pagination-ellipsis {
  @apply px-2 py-2 text-k-text-secondary;
}

@media (max-width: 640px) {
  .pagination {
    @apply flex-col space-y-4;
  }

  .pagination-info {
    @apply text-center;
  }

  .pagination-nav {
    @apply justify-center;
  }

  .pagination-btn {
    @apply px-2 py-1.5 text-xs;
  }

  .page-btn {
    @apply w-8 h-8;
  }
}
</style>