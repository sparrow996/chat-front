<template>
  <div class="h-[200px] border-t border-[#d6d6d6] bg-[#f5f5f5] flex flex-col relative z-20">
    <!-- Toolbar -->
    <div class="h-10 px-4 flex items-center gap-5 text-[#555]">
      <!-- Emoji Button -->
      <div class="relative">
        <button 
          @click="toggleEmojiPicker" 
          class="hover:text-black"
        >
          <i class="far fa-smile text-xl"></i>
        </button>
        
        <div v-if="showEmojiPicker" class="absolute bottom-10 left-[-10px] w-72 h-48 bg-white shadow-xl border rounded-md overflow-y-auto p-2 grid grid-cols-6 gap-2 z-50">
          <button 
            v-for="emoji in EMOJIS" 
            :key="emoji" 
            class="text-xl hover:bg-gray-100 rounded p-1"
            @click="addEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <!-- Sticker Button -->
       <div class="relative">
        <button 
          @click="toggleStickerPicker" 
          class="hover:text-black"
        >
          <i class="far fa-heart text-xl"></i>
        </button>
        
        <div v-if="showStickerPicker" class="absolute bottom-10 left-[-50px] w-80 bg-white shadow-xl border rounded-md p-2 flex flex-col z-50">
          <!-- Sticker Grid -->
          <div class="flex-1 grid grid-cols-4 grid-rows-3 gap-2 min-h-[240px]">
            <button 
                v-for="(sticker, idx) in stickers" 
                :key="idx" 
                class="hover:bg-gray-100 rounded p-1 flex items-center justify-center border border-transparent hover:border-gray-200"
                @click="sendSticker(sticker)"
            >
                <img :src="sticker" alt="Sticker" class="w-16 h-16 object-contain" />
            </button>
            <div v-if="stickers.length === 0" class="col-span-4 row-span-3 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
          </div>
          
          <!-- Pagination -->
          <div class="flex items-center justify-between border-t pt-2 mt-2 px-2 text-xs text-gray-600">
              <button 
                :disabled="currentStickerPage <= 1"
                @click="$emit('stickerPageChange', currentStickerPage - 1)"
                class="p-1 hover:text-black disabled:text-gray-300"
              >
                  <i class="fas fa-chevron-left"></i>
              </button>
              
              <span>{{ currentStickerPage }} / {{ totalStickerPages || 1 }}</span>
              
              <button 
                :disabled="currentStickerPage >= totalStickerPages"
                @click="$emit('stickerPageChange', currentStickerPage + 1)"
                class="p-1 hover:text-black disabled:text-gray-300"
              >
                  <i class="fas fa-chevron-right"></i>
              </button>
          </div>
        </div>
      </div>

      <!-- File Upload -->
      <button @click="fileInput?.click()" class="hover:text-black" :disabled="uploading">
        <i v-if="uploading" class="fas fa-spinner fa-spin text-xl"></i>
        <i v-else class="far fa-folder text-xl"></i>
      </button>
      <input 
        type="file" 
        ref="fileInput" 
        class="hidden" 
        accept="image/*"
        @change="handleFileUpload"
      />

      <button class="hover:text-black">
          <i class="fas fa-cut text-xl"></i>
      </button>

      <button class="hover:text-black">
          <i class="far fa-comment-dots text-xl"></i>
      </button>
    </div>

    <!-- Input Field -->
    <div class="flex-1 px-4 py-1">
      <textarea
        ref="textareaRef"
        v-model="text"
        @keydown.enter.prevent="handleEnter"
        class="w-full h-full bg-transparent resize-none border-none outline-none text-[15px] font-sans"
        placeholder=""
      ></textarea>
    </div>

    <!-- Send Button -->
    <div class="h-12 flex items-center justify-end px-4 pb-2">
      <span class="text-gray-400 text-xs mr-4">Press Enter to send</span>
      <button 
        @click="handleSend"
        :disabled="!text.trim()"
        class="px-6 py-1.5 rounded-sm text-sm border transition-colors"
        :class="text.trim() ? 'bg-[#e9e9e9] text-[#07c160] hover:bg-[#d2d2d2] border-[#e9e9e9]' : 'bg-[#e9e9e9] text-gray-400 border-[#e9e9e9] cursor-default'"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { EMOJIS } from '../constants';
import { MessageType } from '../types';
import { api } from '../services/api';

const props = defineProps({
  stickers: {
    type: Array as () => string[],
    required: true
  },
  currentStickerPage: {
    type: Number,
    required: true
  },
  totalStickerPages: {
    type: Number,
    required: true
  },
  currentUserId: {
    type: String,
    required: true
  }
});

const emit = defineEmits<{
  (e: 'sendMessage', content: string, type: MessageType): void;
  (e: 'stickerPageChange', page: number): void;
}>();

const text = ref('');
const showEmojiPicker = ref(false);
const showStickerPicker = ref(false);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
    showStickerPicker.value = false;
};

const toggleStickerPicker = () => {
    showStickerPicker.value = !showStickerPicker.value;
    showEmojiPicker.value = false;
};

const addEmoji = (emoji: string) => {
    text.value += emoji;
    showEmojiPicker.value = false;
    textareaRef.value?.focus();
};

const sendSticker = (sticker: string) => {
    emit('sendMessage', sticker, MessageType.STICKER);
    showStickerPicker.value = false;
};

const handleEnter = (e: KeyboardEvent) => {
    if (!e.shiftKey) {
        handleSend();
    } else {
        // Allow shift+enter for new line (default behavior)
        text.value += '\n';
    }
};

const handleSend = () => {
    if (!text.value.trim()) return;
    emit('sendMessage', text.value, MessageType.TEXT);
    text.value = '';
    textareaRef.value?.focus();
};

const handleFileUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && props.currentUserId) {
        uploading.value = true;
        try {
            const fileUrl = await api.uploadFile(props.currentUserId, file);
            emit('sendMessage', fileUrl, MessageType.IMAGE);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image.");
        } finally {
            uploading.value = false;
        }
    }
    if (fileInput.value) fileInput.value.value = '';
};
</script>
