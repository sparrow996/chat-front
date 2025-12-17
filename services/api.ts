import { MessageType, User, StickerResponse, Message } from '../types';
import { decryptPayload, encryptPayload, initClientKeys, setServerPublicKey, hashPassword } from './encryptionService';
import { mockSocketConnect } from './mockBackend';
import apiClient from './axiosConfig';

// This would be the base URL in a real app
const API_BASE = '/api';

export const api = {
    // 1. Handshake & Login
    login: async (username: string, password: string): Promise<{ user: User }> => {
        const keyRes = await apiClient.get(`${API_BASE}/auth/key`);
        const serverJwk = keyRes.data;
        await setServerPublicKey(serverJwk);

        // Hash password before sending
        const hashedPassword = await hashPassword(password);

        const clientJwk = await initClientKeys();
        const loginPayload = { username, password: hashedPassword, clientPublicKey: clientJwk };
        const encryptedBody = await encryptPayload(loginPayload); 

        try {
            const res = await apiClient.post(`${API_BASE}/auth/login`, encryptedBody);
            const encryptedRes = res.data;
            return await decryptPayload(encryptedRes);
        } catch (error: any) {
            if (error.response && error.response.status === 401) {
                throw new Error('Invalid credentials');
            }
             if (error.response && error.response.status === 403) {
                throw new Error('Account locked');
            }
            throw new Error('Login failed');
        }
    },

    // 2. Contacts
    getContacts: async (userId: string, query: string = ''): Promise<User[]> => {
        const res = await apiClient.get(`${API_BASE}/contacts`, {
            params: { q: query },
            headers: { 'X-User-ID': userId }
        });
        const encryptedRes = res.data;
        const payload = await decryptPayload(encryptedRes);
        return payload.data;
    },

    addFriend: async (userId: string, friendId: string): Promise<void> => {
        const encryptedPayload = await encryptPayload({ friendId });
        const res = await apiClient.post(`${API_BASE}/contacts`, 
            { payload: encryptedPayload },
            {
                headers: { 
                    'X-User-ID': userId 
                }
            }
        );
        
        const encryptedRes = res.data;
        await decryptPayload(encryptedRes); // Check for errors
    },

    searchUsers: async (userId: string, query: string): Promise<User[]> => {
        const res = await apiClient.get(`${API_BASE}/users/search`, {
             params: { q: query },
             headers: { 'X-User-ID': userId }
        });
        const encryptedRes = res.data;
        const payload = await decryptPayload(encryptedRes);
        return payload.data;
    },

    // 3. Messages
    getMessages: async (userId: string, contactId: string, before?: number) => {
        const res = await apiClient.get(`${API_BASE}/messages`, {
            params: { contactId, before },
            headers: { 'X-User-ID': userId }
        });
        const encryptedRes = res.data;
        return await decryptPayload(encryptedRes);
    },

    // 4. File Upload (New)
    uploadFile: async (userId: string, file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await apiClient.post(`${API_BASE}/upload`, formData, {
            headers: { 'X-User-ID': userId }
        });

        const encryptedRes = res.data;
        const payload = await decryptPayload(encryptedRes);
        return payload.url;
    },

    sendMessage: async (userId: string, receiverId: string, type: MessageType, content: string) => {
        // Content for IMAGE/STICKER is now a URL
        const payload = { type, content };
        const encryptedPayload = await encryptPayload(payload);

        const res = await apiClient.post(`${API_BASE}/messages`, 
            { 
                receiverId, 
                payload: encryptedPayload 
            },
            {
                headers: { 
                    'X-User-ID': userId 
                }
            }
        );
        const encryptedRes = res.data;
        return await decryptPayload(encryptedRes);
    },

    // 5. Stickers
    getStickers: async (userId: string, page: number = 1): Promise<StickerResponse> => {
        const res = await apiClient.get(`${API_BASE}/stickers`, {
            params: { page },
            headers: { 'X-User-ID': userId }
        });
        const encryptedRes = res.data;
        return await decryptPayload(encryptedRes);
    },

    // 6. Settings
    updateProfileInfo: async (userId: string, name: string, avatar: string) => {
        const encryptedUpdates = await encryptPayload({ name, avatar });
        const res = await apiClient.put(`${API_BASE}/settings/profile`, 
            { payload: encryptedUpdates },
            {
                headers: { 
                    'X-User-ID': userId 
                }
            }
        );
        const encryptedRes = res.data;
        return await decryptPayload(encryptedRes);
    },

    updateAppearance: async (userId: string, sidebarWallpaper?: string, chatWallpaper?: string) => {
        const encryptedUpdates = await encryptPayload({ sidebarWallpaper, chatWallpaper });
        const res = await apiClient.put(`${API_BASE}/settings/appearance`, 
            { payload: encryptedUpdates },
            {
                headers: { 
                    'X-User-ID': userId 
                }
            }
        );
        const encryptedRes = res.data;
        return await decryptPayload(encryptedRes);
    },

    // 7. Real-time Socket (Simulated)
    connectSocket: (userId: string, onMessage: (msg: Message) => void) => {
        return mockSocketConnect(userId, async (encryptedPayload) => {
            try {
                const decrypted = await decryptPayload(encryptedPayload);
                if (decrypted.type === 'NEW_MESSAGE' && decrypted.data) {
                    onMessage(decrypted.data);
                }
            } catch (e) {
                console.error("Failed to decrypt incoming socket message", e);
            }
        });
    }
};
