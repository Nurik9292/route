<template>
    <img
      :alt="`Avatar of ${user.name}`"
      :src="avatars()"
      :title="user.name"
      @error="onError"
      class="object-cover rounded-full aspect-square bg-k-bg-primary"
    >
</template>
  
<script>
import { defaultAvatar } from '@/utils'
  
export default {
    name: 'UserAvatar',
    
    props: {
      user: {
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
        if (this.user.avatar && this.user.avatar.startsWith('data:image'))  
          return this.user.avatar;
    
        return this.user.avatar ? 'http://localhost:8081/admin/staff/avatar/' + this.user.avatar : defaultAvatar;
      }
    }
}
</script>