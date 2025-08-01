<template>
  <div class="dashboard-card-skeleton bg-k-bg-secondary border border-k-border rounded-lg p-4 animate-pulse">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="h-3 bg-k-bg-primary rounded w-24 mb-3"></div>
        <div class="h-8 bg-k-bg-primary rounded w-16 mb-2"></div>
        <div class="h-3 bg-k-bg-primary rounded w-20"></div>
      </div>
      <div class="w-12 h-12 bg-k-bg-primary rounded-lg"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardCardSkeleton'
};
</script>