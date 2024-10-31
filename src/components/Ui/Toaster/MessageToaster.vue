<template>
    <div ref="root" class="popover">
        <TransitionGroup class="flex flex-col items-end gap-2" name="toast" tag="ul">
            <li v-for="message in messages" :key="message.id">
              <MessageToast :message="message" @dismiss="removeMessage(message)" />
            </li>
        </TransitionGroup>
    </div>
</template>

<script>
import { uuid } from '@/utils';
import MessageToast from './MessageToast.vue';


export default {
    name: 'MessageToaster',

    components: {
      MessageToast
    },

    data() {
        return {
            root: null,
            messages: []
        }
    },

    expose: ['info', 'success', 'warning', 'error'],

    mounted() {
        this.root = this.$refs.root;
        
        if (this.root) {
          this.root.popover = 'manual';
          
          if (this.root.showPopover) 
              this.root.showPopover();
          
        }
  },

    methods: {
        addMessage(type, content, timeout = 5) {
            this.messages.push({
                type,
                content,
                timeout,
                id: uuid()
            });
        },

        removeMessage(message) {
            this.messages = this.messages.filter(({ id }) => id !== message.id);
        },

        info(content, timeout) {
            this.addMessage('info', content, timeout);
        },

        success(content, timeout) {
          this.addMessage('success', content, timeout);
        },

        warning(content, timeout) {
          this.addMessage('warning', content, timeout);
        },

        error(content, timeout) {
          this.addMessage('danger', content, timeout);
        }
    }
}

</script>



<style lang="postcss" scoped>
.popover, .popover:popover-open {
  inset: unset;
  @apply fixed top-3 right-0 p-0 bg-transparent m-0 overflow-visible border-0 backdrop:bg-transparent;
}

.toast-enter-active {
  @apply opacity-100 transition-all duration-200 ease-in;
}

.toast-leave-active {
  @apply opacity-0 transition-all duration-200 ease-out;
}

.toast-enter-from, .toast-leave-to {
  @apply opacity-0;
  transform: translateX(100px);
}
</style>