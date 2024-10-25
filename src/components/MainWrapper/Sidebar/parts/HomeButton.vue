<template>
    <a
      class="bg-black/20 flex items-center px-3.5 rounded-md !text-k-text-secondary hover:!text-k-text-primary"
      href="#/home"
      @click="onClick"
    >
      <Icon :icon="['fas', 'home']" fixed-width />
    </a>
</template>
  
<script>


export default {
    name: 'HomeButton',  
}

</script>
  