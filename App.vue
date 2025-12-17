<template>
  <div class="flex h-screen w-full items-center justify-center md:p-10 bg-gray-100">
    
    <!-- Login View -->
    <Login v-if="!currentUser" @loginSuccess="handleLoginSuccess" />

    <!-- Chat View -->
    <div v-else class="flex w-full md:max-w-[1000px] h-full md:h-[80vh] bg-[#f5f5f5] md:rounded-md overflow-hidden md:shadow-2xl md:border border-gray-300">
      
      <Sidebar 
        :user="currentUser"
        :contacts="contacts" 
        :activeContactId="activeContactId" 
        @selectContact="setActiveContactId" 
        @openProfile="showProfileModal = true"
        @addFriend="showAddFriendModal = true"
        @searchFriends="handleSearchFriends"
        class="w-full md:w-[280px]"
        :class="mobileSidebarClass"
      />

      <div 
          class="flex-1 flex flex-col bg-[#f5f5f5] relative"
          :class="mobileChatClass"
          :style="chatStyle"
      >
        <div v-if="currentUser.chatWallpaper" class="absolute inset-0 bg-white/30 pointer-events-none z-0"></div>
        
        <template v-if="activeContact">
            <div class="h-14 border-b border-[#e7e7e7]/50 flex items-center justify-between px-4 bg-[#f5f5f5]/90 backdrop-blur-sm z-10">
              <div class="flex items-center gap-3">
                  <button 
                      @click="activeContactId = null" 
                      class="md:hidden text-black px-2"
                  >
                      <i class="fas fa-chevron-left"></i>
                  </button>
                  <div class="font-bold text-lg text-black truncate">
                  {{ activeContact.name }}
                  </div>
              </div>
              <i class="fas fa-ellipsis-h text-gray-500 cursor-pointer hover:text-black"></i>
            </div>

            <div class="flex-1 relative z-10 overflow-hidden flex flex-col">
                <MessageList 
                  :messages="activeMessages" 
                  :activeContact="activeContact" 
                  :currentUserId="currentUser.id"
                  :hasMore="activeChatHasMore"
                  @loadMore="handleLoadMoreMessages"
                />
            </div>

            <InputArea 
              @sendMessage="handleSendMessage" 
              :stickers="stickers"
              :currentStickerPage="currentStickerPage"
              :totalStickerPages="totalStickerPages"
              @stickerPageChange="fetchStickers"
              :currentUserId="currentUser.id"
            />
        </template>
        
        <div v-else class="hidden md:flex flex-col items-center justify-center h-full text-gray-400 relative z-10">
            <i class="fab fa-weixin text-6xl mb-4 text-gray-300"></i>
            <p>Select a contact to start chatting</p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ProfileModal 
      v-if="showProfileModal"
      :user="currentUser" 
      @saveProfile="handleUpdateProfile"
      @saveAppearance="handleUpdateAppearance"
      @close="showProfileModal = false" 
    />
    
    <AddFriendModal 
      v-if="showAddFriendModal"
      :currentUserId="currentUser.id"
      @friendAdded="handleFriendAdded"
      @close="showAddFriendModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import Login from './components/Login.vue';
import Sidebar from './components/Sidebar.vue';
import MessageList from './components/MessageList.vue';
import InputArea from './components/InputArea.vue';
import ProfileModal from './components/ProfileModal.vue';
import AddFriendModal from './components/AddFriendModal.vue';
import { User, ChatState, Message, MessageType } from './types';
import { api } from './services/api';

// State
const currentUser = ref<User | null>(null);
const activeContactId = ref<string | null>(null);
const contacts = ref<User[]>([]);

const stickers = ref<string[]>([]);
const currentStickerPage = ref(1);
const totalStickerPages = ref(1);

const chatData = ref<Record<string, ChatState>>({});

const showProfileModal = ref(false);
const showAddFriendModal = ref(false);

// Computed
const activeContact = computed(() => 
    activeContactId.value ? contacts.value.find(c => c.id === activeContactId.value) : null
);

const activeMessages = computed(() => {
    if (!activeContactId.value) return [];
    return chatData.value[activeContactId.value]?.messages || [];
});

const activeChatHasMore = computed(() => {
    if (!activeContactId.value) return false;
    return chatData.value[activeContactId.value]?.hasMore || false;
});

const mobileSidebarClass = computed(() => activeContactId.value ? 'hidden md:flex' : 'flex w-full');
const mobileChatClass = computed(() => activeContactId.value ? 'flex w-full fixed inset-0 z-10 md:static' : 'hidden md:flex');

const chatStyle = computed(() => ({
    backgroundImage: currentUser.value?.chatWallpaper ? `url(${currentUser.value.chatWallpaper})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
}));

// Actions
let disconnectSocket: (() => void) | null = null;

const setActiveContactId = (id: string) => {
    activeContactId.value = id;
};

const updateContactPreview = (contactId: string, message: Message) => {
    const idx = contacts.value.findIndex(c => c.id === contactId);
    if (idx !== -1) {
        const preview = message.type === MessageType.IMAGE ? '[Image]' : 
                        message.type === MessageType.STICKER ? '[Sticker]' : message.content;
        contacts.value[idx] = {
            ...contacts.value[idx],
            lastMessage: preview,
            lastMessageTimestamp: message.timestamp
        };
    }
};

const fetchContacts = async (query: string = '') => {
    if (!currentUser.value) return;
    try {
        const fetchedContacts = await api.getContacts(currentUser.value.id, query);
        contacts.value = fetchedContacts;
    } catch (e) {
        console.error("Failed to fetch contacts", e);
    }
};

const fetchMessages = async (contactId: string, beforeTimestamp?: number) => {
    if (!currentUser.value) return;
    try {
        const res = await api.getMessages(currentUser.value.id, contactId, beforeTimestamp);
        
        const currentChat = chatData.value[contactId] || { messages: [], hasMore: true };
        
        if (beforeTimestamp) {
            chatData.value[contactId] = {
                messages: [...res.data, ...currentChat.messages],
                hasMore: res.hasMore
            };
        } else {
            chatData.value[contactId] = {
                messages: res.data,
                hasMore: res.hasMore
            };
        }
        
        // If latest messages loaded, update sidebar preview (only if in main list)
        if (res.data.length > 0 && !beforeTimestamp) {
            const lastMsg = res.data[res.data.length - 1];
            updateContactPreview(contactId, lastMsg);
        }

    } catch (e) {
        console.error("Failed to fetch messages", e);
    }
};

const fetchStickers = async (page: number) => {
    if (!currentUser.value) return;
    try {
        const res = await api.getStickers(currentUser.value.id, page);
        stickers.value = res.stickers;
        currentStickerPage.value = res.page;
        totalStickerPages.value = res.totalPages;
    } catch (e) {
        console.error("Failed to fetch stickers", e);
    }
};

const handleLoginSuccess = (user: User) => {
    currentUser.value = user;
    fetchContacts();
    fetchStickers(1);

    // Socket Connection
    if (disconnectSocket) disconnectSocket();
    disconnectSocket = api.connectSocket(user.id, (newMessage) => {
        console.log("New Message Received:", newMessage);
        
        const senderId = newMessage.senderId;
        
        // Update Chat Data
        if (chatData.value[senderId]) {
            chatData.value[senderId].messages.push(newMessage);
        }
        
        // Update Sidebar
        updateContactPreview(senderId, newMessage);
    });
};

onUnmounted(() => {
    if (disconnectSocket) disconnectSocket();
});

const handleLoadMoreMessages = async () => {
    if (!activeContactId.value || !chatData.value[activeContactId.value]?.messages.length) return;
    const oldestMsg = chatData.value[activeContactId.value].messages[0];
    await fetchMessages(activeContactId.value, oldestMsg.timestamp);
};

const handleSendMessage = async (content: string, type: MessageType) => {
    if (!activeContactId.value || !currentUser.value) return;

    try {
        const res = await api.sendMessage(currentUser.value.id, activeContactId.value, type, content);
        const newMessage = res.message;

        // Optimistically add message
        if (!chatData.value[activeContactId.value]) {
            chatData.value[activeContactId.value] = { messages: [], hasMore: false };
        }
        chatData.value[activeContactId.value].messages.push(newMessage);
        
        updateContactPreview(activeContactId.value, newMessage);

    } catch (e) {
        console.error("Send failed", e);
    }
};

const handleFriendAdded = () => {
    fetchContacts();
    showAddFriendModal.value = false;
    activeContactId.value = null;
};

const handleUpdateProfile = async (name: string, avatar: string) => {
    if (!currentUser.value) return;
    try {
        const res = await api.updateProfileInfo(currentUser.value.id, name, avatar);
        if (res.status === 'ok') currentUser.value = res.user;
    } catch(e) { console.error(e); }
    showProfileModal.value = false;
};

const handleUpdateAppearance = async (sidebar: string, chat: string) => {
    if (!currentUser.value) return;
    try {
        const res = await api.updateAppearance(currentUser.value.id, sidebar, chat);
        if (res.status === 'ok') currentUser.value = res.user;
    } catch(e) { console.error(e); }
    showProfileModal.value = false;
};

const handleSearchFriends = (query: string) => {
    fetchContacts(query);
};

// Watch for activeContactId change to load messages
watch(activeContactId, (newId) => {
    if (newId && !chatData.value[newId]) {
        fetchMessages(newId);
    }
});
</script>

<style>
/* Global resets or overrides if needed */
</style>
