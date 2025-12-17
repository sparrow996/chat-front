export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  STICKER = 'STICKER'
}

export interface User {
  id: string; // BIGINT serialized as string
  username?: string; // Added to match DB
  name: string; // Nickname
  avatar: string;
  sidebarWallpaper?: string; // Custom background for friend list
  chatWallpaper?: string;    // Custom background for chat area
  lastMessage?: string;
  lastMessageTime?: string; // Formatted string for UI
  lastMessageTimestamp?: number; // For sorting
  password?: string; // For mock auth only
  status?: number; // 1-Normal, 0-Locked (from DDL)
  remark?: string; // Friend alias (from DDL contacts table)
}

export interface Message {
  id: string; // BIGINT serialized as string
  senderId: string;
  content: string; 
  type: MessageType;
  timestamp: number; // Stored as BIGINT in DB
  isRead?: boolean;    // From DDL: is_read
  isRevoked?: boolean; // From DDL: is_revoked
}

export interface ChatState {
  messages: Message[];
  hasMore: boolean;
}

// Wrapper for encrypted data transport
export interface EncryptedPayload {
  key: string; // RSA-encrypted AES key
  iv: string;  // AES IV
  data: string; // AES-encrypted actual data (JSON stringified)
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: number;
  total?: number;
}

export interface StickerResponse {
    stickers: string[];
    hasMore: boolean;
    page: number;
    total: number;
    totalPages: number;
}