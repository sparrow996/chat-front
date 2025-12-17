<template>
  <div 
    ref="containerRef"
    @scroll="handleScroll"
    class="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#f5f5f5]"
  >
    <!-- Encryption Notice -->
    <div class="flex flex-col items-center justify-center mb-6 gap-2">
       <i v-if="hasMore && loading" class="fas fa-spinner fa-spin text-gray-400"></i>
       <span v-if="!hasMore" class="bg-[#dadada] text-gray-500 text-xs px-2 py-1 rounded-sm text-center">
          Messages are end-to-end encrypted.<br/>RSA-2048 & AES-256
       </span>
    </div>

    <div v-for="msg in messages" :key="msg.id" class="flex flex-col mb-4" :class="isMe(msg) ? 'items-end' : 'items-start'">
      <div class="flex gap-3 max-w-[85%]" :class="isMe(msg) ? 'flex-row-reverse' : 'flex-row'">
        <img 
            :src="isMe(msg) ? 'https://picsum.photos/seed/me/200/200' : activeContact.avatar" 
            alt="Avatar" 
            class="w-9 h-9 rounded-md flex-shrink-0 bg-gray-300 object-cover" 
        />
        
        <div class="relative group">
          <!-- TEXT -->
          <div v-if="msg.type === MessageType.TEXT" 
               class="p-2.5 px-3 rounded-md text-[15px] leading-relaxed break-all shadow-sm relative"
               :class="isMe(msg) ? 'bg-[#95EC69] text-black' : 'bg-white text-black'"
          >
              <!-- Triangle -->
              <div class="absolute top-3 w-0 h-0 border-[6px] border-transparent"
                   :class="isMe(msg) ? 'right-[-10px] border-l-[#95EC69]' : 'left-[-10px] border-r-white'"
              ></div>
              {{ msg.content }}
          </div>

          <!-- IMAGE -->
          <div v-if="msg.type === MessageType.IMAGE" class="rounded-md overflow-hidden bg-white p-1 border border-gray-200 shadow-sm">
             <img :src="msg.content" alt="Sent" class="max-w-[200px] md:max-w-[300px] max-h-[300px] object-contain rounded-sm cursor-pointer" />
          </div>

          <!-- STICKER -->
          <div v-if="msg.type === MessageType.STICKER" class="p-1">
             <img :src="msg.content" alt="Sticker" class="w-24 h-24 object-contain" />
          </div>
        </div>
      </div>
      
      <!-- Time Display -->
      <div class="text-[10px] text-gray-400 mt-1 px-12" :class="isMe(msg) ? 'text-right' : 'text-left'">
         {{ formatMessageTime(msg.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { Message, MessageType, User } from '../types';

const props = defineProps<{
  messages: Message[];
  activeContact: User;
  currentUserId: string;
  hasMore: boolean;
}>();

const emit = defineEmits<{
  (e: 'loadMore'): Promise<void>;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const prevHeightRef = ref(0);

const isMe = (msg: Message) => msg.senderId === props.currentUserId;

const formatMessageTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${month}-${day} ${h}:${m}:${s}`;
};

const handleScroll = async () => {
    if (!containerRef.value || loading.value || !props.hasMore) return;
    
    if (containerRef.value.scrollTop === 0) {
        loading.value = true;
        prevHeightRef.value = containerRef.value.scrollHeight;
        await emit('loadMore');
        // Restore scroll position after data load
        nextTick(() => {
             if (containerRef.value) {
                 const currentHeight = containerRef.value.scrollHeight;
                 containerRef.value.scrollTop = currentHeight - prevHeightRef.value;
                 loading.value = false;
             }
        });
    }
};

// Watch for contact change to scroll to bottom
watch(() => props.activeContact.id, () => {
    nextTick(() => {
        if (containerRef.value) {
            containerRef.value.scrollTop = containerRef.value.scrollHeight;
        }
    });
});

// Watch for NEW messages (appended at end) to scroll to bottom
watch(() => props.messages, (newVal, oldVal) => {
    // We want to scroll to bottom if a new message is added (length increased)
    // AND we are not currently loading history (loading.value is false)
    if (!loading.value) {
         nextTick(() => {
            if (containerRef.value) {
                containerRef.value.scrollTop = containerRef.value.scrollHeight;
            }
        });
    }
}, { deep: true });

onMounted(() => {
    if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
});
</script>
