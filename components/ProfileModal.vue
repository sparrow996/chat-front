<template>
  <el-dialog
    v-model="visible"
    title="Settings"
    width="400px"
    @close="$emit('close')"
  >
    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane label="Profile" name="profile">
          <div class="flex flex-col items-center mb-4 gap-2 mt-2">
            <div class="relative group cursor-pointer" @click="avatarInput?.click()">
                <img :src="avatar" alt="Preview" class="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                <div class="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fas fa-camera text-white"></i>
                </div>
            </div>
            <span class="text-xs text-[#576b95] cursor-pointer" @click="avatarInput?.click()">Change Avatar</span>
            <input type="file" ref="avatarInput" class="hidden" accept="image/*" @change="e => handleFileChange(e, (v) => avatar = v)" />
        </div>

        <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Display Name</label>
            <el-input v-model="name" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Appearance" name="appearance">
         <!-- Sidebar Wallpaper -->
         <div class="space-y-2 mt-2">
             <label class="block text-xs font-semibold text-gray-500">Contact List Background</label>
             <div class="flex gap-2 items-center">
                 <div 
                     class="w-16 h-24 border border-gray-200 rounded bg-gray-100 cursor-pointer overflow-hidden relative"
                     @click="sidebarInput?.click()"
                 >
                     <img v-if="sidebarWallpaper" :src="sidebarWallpaper" class="w-full h-full object-cover" />
                     <div v-else class="flex items-center justify-center h-full text-gray-400 text-xs">None</div>
                 </div>
                 <div class="flex flex-col gap-1">
                     <el-button size="small" @click="sidebarInput?.click()">Upload</el-button>
                     <el-button v-if="sidebarWallpaper" size="small" type="danger" link @click="sidebarWallpaper = ''">Remove</el-button>
                 </div>
                 <input type="file" ref="sidebarInput" class="hidden" accept="image/*" @change="e => handleFileChange(e, (v) => sidebarWallpaper = v)" />
             </div>
         </div>

         <!-- Chat Wallpaper -->
         <div class="space-y-2 mt-4">
             <label class="block text-xs font-semibold text-gray-500">Chat Background</label>
             <div class="flex gap-2 items-center">
                 <div 
                     class="w-16 h-24 border border-gray-200 rounded bg-gray-100 cursor-pointer overflow-hidden relative"
                     @click="chatInput?.click()"
                 >
                     <img v-if="chatWallpaper" :src="chatWallpaper" class="w-full h-full object-cover" />
                     <div v-else class="flex items-center justify-center h-full text-gray-400 text-xs">None</div>
                 </div>
                 <div class="flex flex-col gap-1">
                     <el-button size="small" @click="chatInput?.click()">Upload</el-button>
                     <el-button v-if="chatWallpaper" size="small" type="danger" link @click="chatWallpaper = ''">Remove</el-button>
                 </div>
                 <input type="file" ref="chatInput" class="hidden" accept="image/*" @change="e => handleFileChange(e, (v) => chatWallpaper = v)" />
             </div>
         </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('close')">Cancel</el-button>
        <el-button type="primary" @click="handleSave" style="background-color: #07c160; border-color: #07c160;">Save</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { User } from '../types';

const props = defineProps<{
  user: User;
}>();

const emit = defineEmits<{
  (e: 'saveProfile', name: string, avatar: string): void;
  (e: 'saveAppearance', sidebar: string, chat: string): void;
  (e: 'close'): void;
}>();

const visible = ref(true);
const activeTab = ref('profile');

const name = ref(props.user.name);
const avatar = ref(props.user.avatar);
const sidebarWallpaper = ref(props.user.sidebarWallpaper || '');
const chatWallpaper = ref(props.user.chatWallpaper || '');

const avatarInput = ref<HTMLInputElement | null>(null);
const sidebarInput = ref<HTMLInputElement | null>(null);
const chatInput = ref<HTMLInputElement | null>(null);

const handleFileChange = (e: Event, setter: (s: string) => void) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                setter(ev.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    }
};

const handleSave = () => {
    if (activeTab.value === 'profile') {
        emit('saveProfile', name.value, avatar.value);
    } else {
        emit('saveAppearance', sidebarWallpaper.value, chatWallpaper.value);
    }
};
</script>
