import { User } from './types';

// Initial contacts for fallback (MockBackend manages the real list now)
export const CONTACTS: User[] = [];

// IDs updated to >10000 to match DDL
export const MOCK_SEARCHABLE_USERS: User[] = [
    { id: '10003', name: 'Charlie Puth', avatar: 'https://picsum.photos/seed/charlie/200/200', lastMessage: 'Hey there!', lastMessageTime: '' },
    { id: '10004', name: 'David Beckham', avatar: 'https://picsum.photos/seed/david/200/200', lastMessage: 'Nice to meet you.', lastMessageTime: '' },
    { id: '10005', name: 'Eva Green', avatar: 'https://picsum.photos/seed/eva/200/200', lastMessage: 'Available for chat.', lastMessageTime: '' },
];

export const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
  '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗',
  '🤔', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐',
  '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒',
  '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞',
  '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬',
  '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬',
  '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤠', '🤡', '🥳',
  '🥴', '🥺', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '👹',
  '👍', '👎', '👊', '✌️', '👌', '✋', '💪', '🙏', '👋', '👏'
];