<template>
    <img
      alt="`Avatar of test"
      :src="avatars()"
      title="test"
      @error="onError"
      class="object-cover rounded-full aspect-square bg-k-bg-primary"
    >
</template>
  
<script>
import { defaultAvatar } from '@/utils'
  
export default {
    name: 'AdminAvatar',
    
    props: {
      admin: {
        type: Object,
        required: true,
        validator: function(value) {
          return value && typeof value.name === 'string';
        }
      }
    },
    
 
   
    methods: {
      onError() {
        this.avatar = defaultAvatar; 
      },

      avatars() {        
        // if (this.user.avatar && this.user.avatar.startsWith('data:image'))
        //   return this.user.avatar;
        //
        return  defaultAvatar;
      }
    }
}
</script>