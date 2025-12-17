<template>
  <div class="w-full h-screen flex flex-col items-center justify-center bg-[#f5f5f5] p-6">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
      <div class="text-center mb-6">
        <i class="fas fa-lock text-5xl text-[#07c160] mb-4"></i>
        <h1 class="text-2xl font-semibold text-gray-800">Secure Chat</h1>
        <p class="text-gray-500 text-sm mt-2">RSA-2048 Asymmetric Encryption</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Username</label>
          <el-input 
            v-model="username" 
            placeholder="Username"
            prefix-icon="User"
          />
        </div>

        <div>
           <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
           <el-input 
            v-model="password" 
            type="password" 
            placeholder="Password"
            prefix-icon="Lock"
            show-password
            @keydown.enter="handleLogin"
          />
        </div>

        <p v-if="error" class="text-red-500 text-xs text-center font-medium">{{ error }}</p>

        <el-button 
          type="success" 
          class="w-full" 
          :loading="isLoading" 
          @click="handleLogin"
          :disabled="!!error && error.includes('Critical')"
          style="background-color: #07c160; border-color: #07c160;"
        >
          Log In
        </el-button>
      </div>
      
      <div class="mt-6 text-center text-xs text-gray-400">
         Demo Credentials (ID starts at 10001):<br/>alice / 123<br/>bob / 123
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { User } from '../types';
import { api } from '../services/api';
import { User as UserIcon, Lock } from '@element-plus/icons-vue';

const emit = defineEmits<{
  (e: 'loginSuccess', user: User): void;
}>();

const username = ref('alice');
const password = ref('123');
const isLoading = ref(false);
const error = ref('');

onMounted(() => {
    if (!window.crypto || !window.crypto.subtle) {
      error.value = "Critical Error: Web Crypto API is unavailable. Please use localhost or HTTPS.";
    }
});

const handleLogin = async () => {
    if (!username.value.trim() || !password.value.trim()) return;
    isLoading.value = true;
    error.value = '';

    try {
        const data = await api.login(username.value, password.value);
        emit('loginSuccess', data.user);
    } catch (e: any) {
        console.error(e);
        if (e.message === 'Invalid credentials') {
            error.value = 'Incorrect username or password.';
        } else if (e.message === 'Account locked') {
            error.value = 'This account has been locked.';
        } else {
            error.value = 'Login failed. Please try again.';
        }
    } finally {
        isLoading.value = false;
    }
};
</script>
