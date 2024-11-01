<template>
    <Icon :icon="['fas', 'circle-question']" :title="title" class="help-trigger text-k-primary" />
  </template>
  
  <script>
  
  export default {
    name: 'TooltipIcon',
    
    props: {
      title: {
        type: String,
        required: true,
      },
    },
  
    
  };
  </script>
  