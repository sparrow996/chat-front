import { EncryptedPayload, MessageType, User, StickerResponse, Message } from '../types';
import { decryptPayload, encryptPayload, initClientKeys, setServerPublicKey, hashPassword } from './encryptionService';
import { mockFetch, mockSocketConnect } from './mockBackend';

// This would be the base URL in a real app
const API_BASE = '/api';

export const api = {
    // 1. Handshake & Login
    login: async (username: string, password: string): Promise<{ user: User }> => {
        const keyRes = await mockFetch(`${API_BASE}/auth/key`);
        const serverJwk = await keyRes.json();
        await setServerPublicKey(serverJwk);

        // Hash password before sending
        const hashedPassword = await hashPassword(password);

        const clientJwk = await initClientKeys();
        const loginPayload = { username, password: hashedPassword, clientPublicKey: clientJwk };
        const encryptedBody = await encryptPayload(loginPayload); 

        const res = await mockFetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(encryptedBody)
        });

        if (res.status === 401) {
            throw new Error('Invalid credentials');
        }

        if (!res.ok) throw new Error('Login failed');

        const encryptedRes = await res.json();
        return await decryptPayload(encryptedRes);
    },

    // 2. Contacts
    getContacts: async (userId: string, query: string = ''): Promise<User[]> => {
        const res = await mockFetch(`${API_BASE}/contacts?q=${encodeURIComponent(query)}`, {
            headers: { 'X-User-ID': userId }
        });
        const encryptedRes = await res.json();
        const payload = await decryptPayload(encryptedRes);
        return payload.data;
    },

    addFriend: async (userId: string, friendId: string): Promise<void> => {
        const encryptedPayload = await encryptPayload({ friendId });
        const res = await mockFetch(`${API_BASE}/contacts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': userId 
            },
            body: JSON.stringify({ payload: encryptedPayload })
        });
        
        if (!res.ok) throw new Error('Failed to add friend');
        const encryptedRes = await res.json();
        await decryptPayload(encryptedRes); // Check for errors
    },

    searchUsers: async (userId: string, query: string): Promise<User[]> => {
        const res = await mockFetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`, {
             headers: { 'X-User-ID': userId }
        });
        const encryptedRes = await res.json();
        const payload = await decryptPayload(encryptedRes);
        return payload.data;
    },

    // 3. Messages
    getMessages: async (userId: string, contactId: string, before?: number) => {
        const url = `${API_BASE}/messages?contactId=${contactId}${before ? `&before=${before}` : ''}`;
        const res = await mockFetch(url, {
            headers: { 'X-User-ID': userId }
        });
        const encryptedRes = await res.json();
        return await decryptPayload(encryptedRes);
    },

    // 4. File Upload (New)
    uploadFile: async (userId: string, file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await mockFetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'X-User-ID': userId },
            body: formData as any // Casting for mockFetch compatibility
        });

        if (!res.ok) throw new Error('Upload failed');
        
        const encryptedRes = await res.json();
        const payload = await decryptPayload(encryptedRes);
        return payload.url;
    },

    sendMessage: async (userId: string, receiverId: string, type: MessageType, content: string) => {
        // Content for IMAGE/STICKER is now a URL
        const payload = { type, content };
        const encryptedPayload = await encryptPayload(payload);

        const res = await mockFetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': userId 
            },
            body: JSON.stringify({ 
                receiverId, 
                payload: encryptedPayload 
            })
        });
        const encryptedRes = await res.json();
        return await decryptPayload(encryptedRes);
    },

    // 5. Stickers
    getStickers: async (userId: string, page: number = 1): Promise<StickerResponse> => {
        const res = await mockFetch(`${API_BASE}/stickers?page=${page}`, {
            headers: { 'X-User-ID': userId }
        });
        const encryptedRes = await res.json();
        return await decryptPayload(encryptedRes);
    },

    // 6. Settings
    updateProfileInfo: async (userId: string, name: string, avatar: string) => {
        const encryptedUpdates = await encryptPayload({ name, avatar });
        const res = await mockFetch(`${API_BASE}/settings/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': userId 
            },
            body: JSON.stringify({ payload: encryptedUpdates })
        });
        const encryptedRes = await res.json();
        return await decryptPayload(encryptedRes);
    },

    updateAppearance: async (userId: string, sidebarWallpaper?: string, chatWallpaper?: string) => {
        const encryptedUpdates = await encryptPayload({ sidebarWallpaper, chatWallpaper });
        const res = await mockFetch(`${API_BASE}/settings/appearance`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': userId 
            },
            body: JSON.stringify({ payload: encryptedUpdates })
        });
        const encryptedRes = await res.json();
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