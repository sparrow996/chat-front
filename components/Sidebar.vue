<template>
  <div 
    class="flex flex-col h-full text-white flex-shrink-0 relative"
    :class="className"
    :style="sidebarStyle"
  >
    <!-- Overlay for readability if wallpaper exists -->
    <div v-if="user.sidebarWallpaper" class="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>

    <div class="relative z-10 flex flex-col h-full">
      <!-- User Header -->
      <div class="p-4 flex items-center gap-3 mb-2">
        <img 
          :src="user.avatar" 
          alt="My Avatar" 
          @click="$emit('openProfile')"
          class="w-10 h-10 rounded-md border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity object-cover bg-gray-400"
        />
        <div class="flex-1 min-w-0" @click="$emit('openProfile')">
          <span class="font-semibold block truncate cursor-pointer hover:text-gray-300 drop-shadow-md">{{ user.name }}</span>
        </div>
        <div class="ml-auto flex items-center space-x-4 text-gray-400">
          <button @click="$emit('addFriend')" title="Add Friend" class="hover:text-white transition-colors drop-shadow-md">
            <i class="fas fa-plus-circle text-lg"></i>
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="px-3 mb-2">
        <div class="bg-[#262626]/80 rounded-md flex items-center p-1.5 px-2 text-xs border border-white/10">
          <i class="fas fa-search text-gray-500 mr-2"></i>
          <input 
            type="text" 
            placeholder="Search friends (Press Enter)" 
            v-model="searchTerm"
            @keydown.enter="handleSearch"
            @blur="handleSearch"
            class="bg-transparent border-none outline-none text-gray-300 w-full placeholder-gray-500"
          />
        </div>
      </div>

      <!-- Contact List -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div 
          v-for="contact in contacts" 
          :key="contact.id"
          @click="$emit('selectContact', contact.id)"
          class="flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-white/5"
          :class="[
            activeContactId === contact.id ? 'bg-[#c5c5c5] text-black' : 'hover:bg-white/10'
          ]"
        >
          <img 
            :src="contact.avatar" 
            :alt="contact.remark || contact.name" 
            class="w-10 h-10 rounded-md flex-shrink-0 object-cover bg-gray-400"
          />
          <div class="flex-1 overflow-hidden min-w-0">
            <div class="flex justify-between items-center">
              <span 
                class="font-medium truncate drop-shadow-sm" 
                :class="activeContactId === contact.id ? '' : 'text-gray-100'"
              >
                {{ contact.remark || contact.name }}
              </span>
              <span 
                class="text-[10px] flex-shrink-0 ml-1"
                :class="activeContactId === contact.id ? 'text-gray-700' : 'text-gray-300'"
              >
                {{ formatSidebarTime(contact.lastMessageTimestamp) }}
              </span>
            </div>
            <p 
              class="text-xs truncate"
              :class="activeContactId === contact.id ? 'text-gray-800' : 'text-gray-300/70'"
            >
              {{ getMessagePreview(contact.lastMessage) }}
            </p>
          </div>
        </div>
        <div v-if="contacts.length === 0" class="text-center text-gray-400 text-xs mt-4">
            No contacts found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { User } from '../types';

const props = defineProps<{
  user: User;
  contacts: User[];
  activeContactId: string | null;
  className?: string;
}>();

const emit = defineEmits<{
  (e: 'selectContact', id: string): void;
  (e: 'openProfile'): void;
  (e: 'addFriend'): void;
  (e: 'searchFriends', query: string): void;
}>();

const searchTerm = ref('');

const sidebarStyle = computed(() => {
  return {
    backgroundColor: props.user.sidebarWallpaper ? 'transparent' : '#2e2e2e',
    backgroundImage: props.user.sidebarWallpaper ? `url(${props.user.sidebarWallpaper})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
});

const handleSearch = () => {
  emit('searchFriends', searchTerm.value);
};

const formatSidebarTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getMessagePreview = (msg?: string) => {
  if (!msg) return 'No messages yet';
  return msg.length > 10 ? msg.substring(0, 10) + '...' : msg;
};
</script>

<style scoped>
/* Optional: specific styles if not using Tailwind for everything */
</style>
