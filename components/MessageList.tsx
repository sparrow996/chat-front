import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Message, MessageType, User } from '../types';

interface MessageListProps {
  messages: Message[];
  activeContact: User;
  currentUserId: string;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
}

const formatMessageTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${month}-${day} ${h}:${m}:${s}`;
};

const MessageBubble: React.FC<{ message: Message; isMe: boolean; avatar: string }> = ({ message, isMe, avatar }) => {
  return (
    <div className={`flex flex-col mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        <img src={avatar} alt="Avatar" className="w-9 h-9 rounded-md flex-shrink-0 bg-gray-300 object-cover" />
        
        <div className={`relative group`}>
          {message.type === MessageType.TEXT && (
            <div className={`p-2.5 px-3 rounded-md text-[15px] leading-relaxed break-all shadow-sm relative ${
              isMe ? 'bg-[#95EC69] text-black' : 'bg-white text-black'
            }`}>
              {/* Triangle */}
               <div className={`absolute top-3 w-0 h-0 border-[6px] border-transparent ${
                 isMe 
                   ? 'right-[-10px] border-l-[#95EC69]' 
                   : 'left-[-10px] border-r-white'
               }`}></div>
              {message.content}
            </div>
          )}

          {message.type === MessageType.IMAGE && (
            <div className="rounded-md overflow-hidden bg-white p-1 border border-gray-200 shadow-sm">
               <img src={message.content} alt="Sent" className="max-w-[200px] md:max-w-[300px] max-h-[300px] object-contain rounded-sm cursor-pointer" />
            </div>
          )}

          {message.type === MessageType.STICKER && (
             <div className="p-1">
               <img src={message.content} alt="Sticker" className="w-24 h-24 object-contain" />
             </div>
          )}
        </div>
      </div>
      
      {/* Time Display Below Message */}
      <div className={`text-[10px] text-gray-400 mt-1 px-12 ${isMe ? 'text-right' : 'text-left'}`}>
         {formatMessageTime(message.timestamp)}
      </div>
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = ({ messages, activeContact, currentUserId, onLoadMore, hasMore }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const prevHeightRef = useRef(0);

  // Auto scroll to bottom on initial load or new message (if near bottom)
  useEffect(() => {
     if (!loading && containerRef.current) {
        // Simple logic: If it's a fresh chat load (few messages) or we just sent one, scroll to bottom
        // Enhancements could calculate position. For now, simply scroll to bottom on contact switch
     }
  }, [activeContact.id]);

  // Use LayoutEffect to maintain scroll position when loading more
  useLayoutEffect(() => {
      if (containerRef.current && loading) {
          const currentHeight = containerRef.current.scrollHeight;
          const heightDiff = currentHeight - prevHeightRef.current;
          containerRef.current.scrollTop = heightDiff;
          setLoading(false);
      } else if (containerRef.current && !loading) {
          // New message arrival or contact switch - scroll to bottom
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
  }, [messages]);

  const handleScroll = async () => {
      if (!containerRef.current || loading || !hasMore) return;
      
      if (containerRef.current.scrollTop === 0) {
          setLoading(true);
          prevHeightRef.current = containerRef.current.scrollHeight;
          await onLoadMore();
      }
  };

  return (
    <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#f5f5f5]"
    >
      {/* Encryption Notice */}
      <div className="flex flex-col items-center justify-center mb-6 gap-2">
         {hasMore && loading && <i className="fas fa-spinner fa-spin text-gray-400"></i>}
         {!hasMore && (
            <span className="bg-[#dadada] text-gray-500 text-xs px-2 py-1 rounded-sm text-center">
            Messages are end-to-end encrypted.<br/>RSA-2048 & AES-256
            </span>
         )}
      </div>

      {messages.map((msg) => (
        <MessageBubble 
          key={msg.id} 
          message={msg} 
          isMe={msg.senderId === currentUserId}
          avatar={msg.senderId === currentUserId ? 'https://picsum.photos/seed/me/200/200' : activeContact.avatar}
        />
      ))}
    </div>
  );
};

export default MessageList;