<template>
  <el-dialog
    v-model="visible"
    title="Add Friend"
    width="400px"
    @close="$emit('close')"
  >
    <div class="flex gap-2 mb-4">
      <el-input 
        v-model="searchQuery" 
        placeholder="Search by ID or Name" 
        @keydown.enter="handleSearch"
      >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
      </el-input>
      <el-button type="success" @click="handleSearch" :loading="loading" style="background-color: #07c160; border-color: #07c160;">
        Search
      </el-button>
    </div>

    <p v-if="error" class="text-red-500 text-xs mt-2">{{ error }}</p>

    <div class="max-h-60 overflow-y-auto space-y-2 mt-2">
      <div v-for="u in results" :key="u.id" class="flex items-center justify-between bg-gray-50 p-2 rounded">
        <div class="flex items-center gap-2">
          <img :src="u.avatar" class="w-8 h-8 rounded bg-gray-300 object-cover"/>
          <div>
            <div class="text-sm font-medium">{{ u.name }}</div>
            <div class="text-xs text-gray-500">{{ u.id }}</div>
          </div>
        </div>
        <el-button size="small" type="primary" plain @click="handleAdd(u.id)">Add</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { User } from '../types';
import { api } from '../services/api';
import { Search } from '@element-plus/icons-vue';

const props = defineProps<{
  currentUserId: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'friendAdded'): void;
}>();

// Setup visible binding for el-dialog
const visible = ref(true);

const searchQuery = ref('');
const results = ref<User[]>([]);
const loading = ref(false);
const error = ref('');

const handleSearch = async () => {
    if (!searchQuery.value.trim()) return;
    loading.value = true;
    error.value = '';
    results.value = [];

    try {
        const users = await api.searchUsers(props.currentUserId, searchQuery.value);
        results.value = users;
        if (users.length === 0) error.value = 'No users found.';
    } catch (e) {
        error.value = 'Search failed.';
    } finally {
        loading.value = false;
    }
};

const handleAdd = async (userId: string) => {
    try {
        await api.addFriend(props.currentUserId, userId);
        emit('friendAdded');
        visible.value = false;
    } catch (e) {
        alert('Failed to add friend');
    }
};
</script>
