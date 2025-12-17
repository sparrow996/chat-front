import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';
import Login from './components/Login';
import ProfileModal from './components/ProfileModal';
import AddFriendModal from './components/AddFriendModal';
import { ChatState, Message, MessageType, User } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<User[]>([]);
  
  // Sticker State
  const [stickers, setStickers] = useState<string[]>([]);
  const [currentStickerPage, setCurrentStickerPage] = useState(1);
  const [totalStickerPages, setTotalStickerPages] = useState(1);
  
  const [chatData, setChatData] = useState<Record<string, ChatState>>({});
  
  // UI State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // --- DATA FETCHING ---

  const fetchContacts = useCallback(async (query: string = '') => {
      if (!currentUser) return;
      try {
          const fetchedContacts = await api.getContacts(currentUser.id, query);
          setContacts(fetchedContacts);
      } catch (e) {
          console.error("Failed to fetch contacts", e);
      }
  }, [currentUser]);

  const fetchMessages = useCallback(async (contactId: string, beforeTimestamp?: number) => {
      if (!currentUser) return;
      try {
          const res = await api.getMessages(currentUser.id, contactId, beforeTimestamp);
          
          setChatData(prev => {
              const currentChat = prev[contactId] || { messages: [], hasMore: true };
              
              if (beforeTimestamp) {
                  return {
                      ...prev,
                      [contactId]: {
                          messages: [...res.data, ...currentChat.messages],
                          hasMore: res.hasMore
                      }
                  };
              } else {
                  return {
                      ...prev,
                      [contactId]: {
                          messages: res.data,
                          hasMore: res.hasMore
                      }
                  };
              }
          });
          
          // If latest messages loaded, update sidebar preview (only if in main list)
          if (res.data.length > 0 && !beforeTimestamp) {
              const lastMsg = res.data[res.data.length - 1];
              updateContactPreview(contactId, lastMsg);
          }

      } catch (e) {
          console.error("Failed to fetch messages", e);
      }
  }, [currentUser]);

  const fetchStickers = useCallback(async (page: number) => {
      if (!currentUser) return;
      try {
          const res = await api.getStickers(currentUser.id, page);
          setStickers(res.stickers);
          setCurrentStickerPage(res.page);
          setTotalStickerPages(res.totalPages);
      } catch (e) {
          console.error("Failed to fetch stickers", e);
      }
  }, [currentUser]);

  // Load data on login & Initialize Socket
  useEffect(() => {
      if (currentUser) {
          fetchContacts();
          fetchStickers(1);

          // Connect to Socket
          const disconnect = api.connectSocket(currentUser.id, (newMessage) => {
              console.log("New Message Received:", newMessage);
              
              // 1. Update Chat Data if message belongs to a loaded chat
              // We check senderId because we only receive messages sent BY others here.
              const senderId = newMessage.senderId;
              
              setChatData(prev => {
                  const chat = prev[senderId];
                  if (chat) {
                      return {
                          ...prev,
                          [senderId]: {
                              ...chat,
                              messages: [...chat.messages, newMessage]
                          }
                      };
                  }
                  return prev; // If chat not loaded, we don't need to append, it will load when opened
              });

              // 2. Update Sidebar Preview
              updateContactPreview(senderId, newMessage);
              
              // 3. Optional: Play sound or show notification
          });

          return () => {
              disconnect();
          };
      }
  }, [currentUser, fetchContacts, fetchStickers]);

  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
      // Contacts will be fetched by the effect above
  };

  const updateContactPreview = (contactId: string, message: Message) => {
      setContacts(prev => prev.map(c => {
          if (c.id === contactId) {
              const preview = message.type === MessageType.IMAGE ? '[Image]' : 
                              message.type === MessageType.STICKER ? '[Sticker]' : message.content;
              return {
                  ...c,
                  lastMessage: preview,
                  lastMessageTimestamp: message.timestamp
              };
          }
          return c;
      }));
  };

  useEffect(() => {
      if (activeContactId && !chatData[activeContactId]) {
          fetchMessages(activeContactId);
      }
  }, [activeContactId, fetchMessages, chatData]);

  // --- HANDLERS ---

  const handleLoadMoreMessages = async () => {
      if (!activeContactId || !chatData[activeContactId]?.messages.length) return;
      const oldestMsg = chatData[activeContactId].messages[0];
      await fetchMessages(activeContactId, oldestMsg.timestamp);
  };

  const handleSendMessage = async (content: string, type: MessageType) => {
    if (!activeContactId || !currentUser) return;

    try {
        const res = await api.sendMessage(currentUser.id, activeContactId, type, content);
        const newMessage = res.message;

        setChatData(prev => ({
            ...prev,
            [activeContactId]: {
                ...prev[activeContactId],
                messages: [...(prev[activeContactId]?.messages || []), newMessage]
            }
        }));
        updateContactPreview(activeContactId, newMessage);

    } catch (e) {
        console.error("Send failed", e);
    }
  };

  const handleFriendAdded = () => {
      fetchContacts();
      setShowAddFriendModal(false);
      setActiveContactId(null); 
  };

  const handleUpdateProfile = async (name: string, avatar: string) => {
      if (!currentUser) return;
      try {
          const res = await api.updateProfileInfo(currentUser.id, name, avatar);
          if (res.status === 'ok') setCurrentUser(res.user);
      } catch(e) { console.error(e); }
      setShowProfileModal(false);
  };

  const handleUpdateAppearance = async (sidebar: string, chat: string) => {
      if (!currentUser) return;
      try {
          const res = await api.updateAppearance(currentUser.id, sidebar, chat);
          if (res.status === 'ok') setCurrentUser(res.user);
      } catch(e) { console.error(e); }
      setShowProfileModal(false);
  };

  const handleSearchFriends = (query: string) => {
      fetchContacts(query);
  };

  // --- RENDER ---

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const activeContact = activeContactId ? contacts.find(c => c.id === activeContactId) : null;
  const activeChat = activeContactId ? chatData[activeContactId] : null;

  const mobileSidebarClass = activeContactId ? 'hidden md:flex' : 'flex w-full';
  const mobileChatClass = activeContactId ? 'flex w-full fixed inset-0 z-10 md:static' : 'hidden md:flex';

  return (
    <div className="flex h-screen w-full items-center justify-center md:p-10 bg-gray-100">
      <div className="flex w-full md:max-w-[1000px] h-full md:h-[80vh] bg-[#f5f5f5] md:rounded-md overflow-hidden md:shadow-2xl md:border border-gray-300">
        
        <Sidebar 
          user={currentUser}
          contacts={contacts} 
          activeContactId={activeContactId} 
          onSelectContact={setActiveContactId} 
          onOpenProfile={() => setShowProfileModal(true)}
          onAddFriend={() => setShowAddFriendModal(true)}
          onSearchFriends={handleSearchFriends}
          className={`w-full md:w-[280px] ${mobileSidebarClass}`}
        />

        <div 
            className={`flex-1 flex flex-col bg-[#f5f5f5] relative ${mobileChatClass}`}
            style={{ 
                backgroundImage: currentUser.chatWallpaper ? `url(${currentUser.chatWallpaper})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
          {currentUser.chatWallpaper && <div className="absolute inset-0 bg-white/30 pointer-events-none z-0"></div>}
          
          {activeContact ? (
            <>
              <div className="h-14 border-b border-[#e7e7e7]/50 flex items-center justify-between px-4 bg-[#f5f5f5]/90 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setActiveContactId(null)} 
                        className="md:hidden text-black px-2"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="font-bold text-lg text-black truncate">
                    {activeContact.name}
                    </div>
                </div>
                <i className="fas fa-ellipsis-h text-gray-500 cursor-pointer hover:text-black"></i>
              </div>

              <div className="flex-1 relative z-10 overflow-hidden flex flex-col">
                  <MessageList 
                    messages={activeChat?.messages || []} 
                    activeContact={activeContact} 
                    currentUserId={currentUser.id}
                    onLoadMore={handleLoadMoreMessages}
                    hasMore={activeChat?.hasMore || false}
                  />
              </div>

              <InputArea 
                onSendMessage={handleSendMessage} 
                stickers={stickers}
                currentStickerPage={currentStickerPage}
                totalStickerPages={totalStickerPages}
                onStickerPageChange={fetchStickers}
                currentUserId={currentUser.id}
              />
            </>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400 relative z-10">
                <i className="fab fa-weixin text-6xl mb-4 text-gray-300"></i>
                <p>Select a contact to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {showProfileModal && (
          <ProfileModal 
            user={currentUser} 
            onSaveProfile={handleUpdateProfile}
            onSaveAppearance={handleUpdateAppearance}
            onClose={() => setShowProfileModal(false)} 
          />
      )}
      
      {showAddFriendModal && (
          <AddFriendModal 
            currentUserId={currentUser.id}
            onFriendAdded={handleFriendAdded}
            onClose={() => setShowAddFriendModal(false)}
          />
      )}
    </div>
  );
};

export default App;