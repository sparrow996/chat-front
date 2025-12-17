import { User, Message, MessageType, EncryptedPayload } from '../types';

// --- SERVER-SIDE ENCRYPTION SIMULATION ---
let serverKeyPair: CryptoKeyPair | null = null;
const clientPublicKeys: Map<string, CryptoKey> = new Map();

// Utils
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = ''; const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
};
const base64ToArrayBuffer = (base64: string) => {
    const binary = window.atob(base64); const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
};

const initServerKeys = async () => {
  if (serverKeyPair) return;
  serverKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
};

// Encrypt data for a specific client
const serverEncrypt = async (data: any, clientPublicKey: CryptoKey): Promise<EncryptedPayload> => {
  const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  const encryptedDataBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encodedData);
  
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, clientPublicKey, rawAesKey);

  return {
    key: arrayBufferToBase64(encryptedKeyBuffer),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(encryptedDataBuffer)
  };
};

// Decrypt data from client
const serverDecrypt = async (payload: EncryptedPayload): Promise<any> => {
  if (!serverKeyPair) await initServerKeys();
  
  const encryptedKey = base64ToArrayBuffer(payload.key);
  const rawAesKey = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, serverKeyPair!.privateKey, encryptedKey);
  const aesKey = await window.crypto.subtle.importKey("raw", rawAesKey, { name: "AES-GCM" }, true, ["decrypt"]);
  
  const iv = base64ToArrayBuffer(payload.iv);
  const encryptedData = base64ToArrayBuffer(payload.data);
  const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, encryptedData);
  
  return JSON.parse(new TextDecoder().decode(decryptedBuffer));
};

// --- DATABASE SIMULATION (Matching Optimized DDL) ---
// Passwords are SHA-256 hash of '123'
const DEFAULT_HASH = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

// IDs start from 10000 per DDL
const MOCK_USERS: User[] = [
  { id: '10001', username: 'alice', name: 'Alice', avatar: 'https://picsum.photos/seed/alice/200/200', password: DEFAULT_HASH, status: 1 },
  { id: '10002', username: 'bob', name: 'Bob', avatar: 'https://picsum.photos/seed/bob/200/200', password: DEFAULT_HASH, status: 1 },
  { id: '10003', username: 'charlie', name: 'Charlie', avatar: 'https://picsum.photos/seed/charlie/200/200', password: DEFAULT_HASH, status: 1 },
  { id: '10004', username: 'david', name: 'David', avatar: 'https://picsum.photos/seed/david/200/200', password: DEFAULT_HASH, status: 1 },
  { id: '10005', username: 'eva', name: 'Eva', avatar: 'https://picsum.photos/seed/eva/200/200', password: DEFAULT_HASH, status: 1 },
];

// Relationship Map: UserId -> Set<FriendId>
const MOCK_FRIENDS = new Map<string, Set<string>>();
// Contact Metadata (Remarks): Key = "UserId_FriendId", Value = Remark
const MOCK_REMARKS = new Map<string, string>();

// Generate 60 stickers
const MOCK_STICKERS = Array.from({ length: 60 }, (_, i) => `https://picsum.photos/seed/sticker${i}/100/100`);

const messageStore: Map<string, Message[]> = new Map();
const getChatId = (u1: string, u2: string) => [u1, u2].sort().join('_');

// --- REAL-TIME SOCKET SIMULATION ---
type SocketCallback = (encryptedPayload: EncryptedPayload) => void;
const connectedClients = new Map<string, SocketCallback>();

const pushToClient = async (userId: string, data: any) => {
    const callback = connectedClients.get(userId);
    const clientKey = clientPublicKeys.get(userId);
    
    if (callback && clientKey) {
        const encrypted = await serverEncrypt(data, clientKey);
        setTimeout(() => callback(encrypted), 100); 
    }
};

export const mockSocketConnect = (userId: string, onMessage: SocketCallback) => {
    console.log(`[MockSocket] Client connected: ${userId}`);
    connectedClients.set(userId, onMessage);
    return () => {
        console.log(`[MockSocket] Client disconnected: ${userId}`);
        connectedClients.delete(userId);
    };
};

// Init data
const initData = () => {
    if (messageStore.size > 0) return;
    
    // Setup initial friends: Alice (10001) <-> Bob (10002)
    const aliceId = '10001';
    const bobId = '10002';

    if (!MOCK_FRIENDS.has(aliceId)) MOCK_FRIENDS.set(aliceId, new Set([bobId]));
    if (!MOCK_FRIENDS.has(bobId)) MOCK_FRIENDS.set(bobId, new Set([aliceId]));

    // Set a remark for Bob from Alice's perspective
    MOCK_REMARKS.set(`${aliceId}_${bobId}`, "Bobby");

    // Generate messages
    const chatId = getChatId(aliceId, bobId);
    const msgs: Message[] = [];
    const count = 50;
    const now = Date.now();
    for (let i = 0; i < count; i++) {
        msgs.push({
            id: (now - (count - i) * 10000).toString(), // Simulated BIGINT ID
            senderId: Math.random() > 0.5 ? aliceId : bobId,
            content: `Mock message #${i} from DDL optimized backend.`,
            type: MessageType.TEXT,
            timestamp: now - (count - i) * 3600000,
            isRead: true,
            isRevoked: false
        });
    }
    messageStore.set(chatId, msgs);
};
initData();

// --- REQUEST HANDLER ---

export const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    const headers = init?.headers as Record<string, string>;
    const userId = headers?.['X-User-ID'];

    console.log(`[MockServer] ${method} ${url}`);
    
    await new Promise(r => setTimeout(r, 200));

    try {
        await initServerKeys();

        // 1. GET Public Key
        if (url.endsWith('/api/auth/key') && method === 'GET') {
            const serverJwk = await window.crypto.subtle.exportKey("jwk", serverKeyPair!.publicKey);
            return new Response(JSON.stringify(serverJwk), { status: 200 });
        }

        // 2. POST Login
        if (url.endsWith('/api/auth/login') && method === 'POST') {
             const body = JSON.parse(init?.body as string);
             const loginData = await serverDecrypt(body);
             const { username, password, clientPublicKey } = loginData;

             // Match against lowercase username
             const user = MOCK_USERS.find(u => u.username === username.toLowerCase() && u.password === password);
             
             if (!user) {
                 return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
             }

             if (user.status === 0) {
                 return new Response(JSON.stringify({ error: "Account locked" }), { status: 403 });
             }

             const importedClientKey = await window.crypto.subtle.importKey(
                 "jwk", clientPublicKey, {name:"RSA-OAEP", hash:"SHA-256"}, true, ["encrypt"]
             );
             clientPublicKeys.set(user.id, importedClientKey);

             const responseData = { status: 'ok', user: user };
             const encryptedResponse = await serverEncrypt(responseData, importedClientKey);
             return new Response(JSON.stringify(encryptedResponse), { status: 200 });
        }

        // --- AUTH MIDDLEWARE ---
        const clientKey = userId ? clientPublicKeys.get(userId) : null;
        if (!clientKey) {
            return new Response("Unauthorized", { status: 401 });
        }

        // POST Upload
        if (url.endsWith('/api/upload') && method === 'POST') {
            const formData = init?.body as FormData;
            const file = formData.get('file') as File;
            if (!file) return new Response("No file provided", { status: 400 });
            const fileUrl = URL.createObjectURL(file);
            const encryptedResponse = await serverEncrypt({ url: fileUrl }, clientKey);
            return new Response(JSON.stringify(encryptedResponse), { status: 200 });
        }

        // GET/POST Contacts
        if (url.includes('/api/contacts')) {
             if (method === 'GET') {
                 const urlObj = new URL(url, 'http://localhost');
                 const query = urlObj.searchParams.get('q')?.toLowerCase() || '';

                 const friendIds = MOCK_FRIENDS.get(userId) || new Set();
                 let friends = MOCK_USERS
                    .filter(u => friendIds.has(u.id))
                    .map(u => {
                        const chatId = getChatId(userId, u.id);
                        const msgs = messageStore.get(chatId) || [];
                        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                        const remark = MOCK_REMARKS.get(`${userId}_${u.id}`);
                        
                        let lastMessageText = '';
                        if (lastMsg) {
                            lastMessageText = lastMsg.type === MessageType.TEXT ? lastMsg.content : 
                                              lastMsg.type === MessageType.IMAGE ? '[Image]' : '[Sticker]';
                        }

                        return {
                            ...u,
                            password: '', 
                            remark: remark, // Return remark field
                            lastMessage: lastMessageText,
                            lastMessageTimestamp: lastMsg?.timestamp
                        };
                    });
                 
                 if (query) {
                     friends = friends.filter(u => 
                         u.name.toLowerCase().includes(query) || 
                         u.username?.includes(query) || 
                         (u.remark && u.remark.toLowerCase().includes(query)) ||
                         u.id.includes(query)
                     );
                 }
                 
                 const encryptedResponse = await serverEncrypt({ data: friends }, clientKey);
                 return new Response(JSON.stringify(encryptedResponse), { status: 200 });
             }

             if (method === 'POST') {
                 const body = JSON.parse(init?.body as string);
                 const { friendId } = await serverDecrypt(body.payload);
                 
                 if (!MOCK_USERS.find(u => u.id === friendId)) {
                      return new Response("User not found", { status: 404 });
                 }

                 if (!MOCK_FRIENDS.has(userId)) MOCK_FRIENDS.set(userId, new Set());
                 MOCK_FRIENDS.get(userId)!.add(friendId);
                 if (!MOCK_FRIENDS.has(friendId)) MOCK_FRIENDS.set(friendId, new Set());
                 MOCK_FRIENDS.get(friendId)!.add(userId);

                 const encryptedResponse = await serverEncrypt({ status: 'ok' }, clientKey);
                 return new Response(JSON.stringify(encryptedResponse), { status: 200 });
             }
        }

        // GET Search Users
        if (url.includes('/api/users/search') && method === 'GET') {
             const urlObj = new URL(url, 'http://localhost');
             const query = urlObj.searchParams.get('q')?.toLowerCase() || '';
             
             const results = MOCK_USERS
                .filter(u => u.id !== userId && (u.name.toLowerCase().includes(query) || u.username?.includes(query) || u.id === query))
                .map(u => ({ ...u, password: '' }));

             const encryptedResponse = await serverEncrypt({ data: results }, clientKey);
             return new Response(JSON.stringify(encryptedResponse), { status: 200 });
        }

        // GET Messages
        if (url.includes('/api/messages') && method === 'GET') {
            const urlObj = new URL(url, 'http://localhost');
            const contactId = urlObj.searchParams.get('contactId')!;
            const before = Number(urlObj.searchParams.get('before') || Date.now());

            const chatId = getChatId(userId, contactId);
            const allMessages = messageStore.get(chatId) || [];
            const olderMessages = allMessages.filter(m => m.timestamp < before);
            const slice = olderMessages.slice(-20);
            
            const responseData = {
                data: slice,
                hasMore: olderMessages.length > 20,
                nextCursor: slice.length > 0 ? slice[0].timestamp : 0
            };
            
            const encryptedResponse = await serverEncrypt(responseData, clientKey);
            return new Response(JSON.stringify(encryptedResponse), { status: 200 });
        }

        // POST Message
        if (url.endsWith('/api/messages') && method === 'POST') {
            const body = JSON.parse(init?.body as string);
            const { receiverId, payload } = body;
            const msgData = await serverDecrypt(payload);
            
            const chatId = getChatId(userId, receiverId);
            if (!messageStore.has(chatId)) messageStore.set(chatId, []);
            
            const newMessage: Message = {
                id: Date.now().toString(), // Mock ID
                senderId: userId,
                content: msgData.content, 
                type: msgData.type,
                timestamp: Date.now(),
                isRead: false,
                isRevoked: false
            };
            messageStore.get(chatId)?.push(newMessage);
            
            const encryptedResponse = await serverEncrypt({ message: newMessage }, clientKey);
            await pushToClient(receiverId, { type: 'NEW_MESSAGE', data: newMessage });
            return new Response(JSON.stringify(encryptedResponse), { status: 200 });
        }

        // GET Stickers
        if (url.includes('/api/stickers') && method === 'GET') {
            const urlObj = new URL(url, 'http://localhost');
            const page = Number(urlObj.searchParams.get('page') || 1);
            const limit = 12;
            const start = (page - 1) * limit;
            const end = start + limit;
            const sliced = MOCK_STICKERS.slice(start, end);
            
            const encryptedResponse = await serverEncrypt({ 
                stickers: sliced, 
                hasMore: end < MOCK_STICKERS.length, 
                page, 
                total: MOCK_STICKERS.length,
                totalPages: Math.ceil(MOCK_STICKERS.length / limit) 
            }, clientKey);
            return new Response(JSON.stringify(encryptedResponse), { status: 200 });
        }

        // PUT Settings
        if (url.includes('/api/settings')) {
            const body = JSON.parse(init?.body as string);
            const updates = await serverDecrypt(body.payload);
            const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                if (url.endsWith('profile')) {
                    if (updates.name) MOCK_USERS[userIndex].name = updates.name;
                    if (updates.avatar) MOCK_USERS[userIndex].avatar = updates.avatar;
                }
                if (url.endsWith('appearance')) {
                    if (updates.sidebarWallpaper !== undefined) MOCK_USERS[userIndex].sidebarWallpaper = updates.sidebarWallpaper;
                    if (updates.chatWallpaper !== undefined) MOCK_USERS[userIndex].chatWallpaper = updates.chatWallpaper;
                }
                const encryptedResponse = await serverEncrypt({ status: 'ok', user: MOCK_USERS[userIndex] }, clientKey);
                return new Response(JSON.stringify(encryptedResponse), { status: 200 });
            }
        }

        return new Response("Not Found", { status: 404 });

    } catch (e) {
        console.error("Mock Server Error", e);
        return new Response(JSON.stringify({ error: "Internal Error" }), { status: 500 });
    }
};