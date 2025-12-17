import React, { useState, useRef } from 'react';
import { EMOJIS } from '../constants';
import { MessageType } from '../types';
import { api } from '../services/api';

interface InputAreaProps {
  onSendMessage: (content: string, type: MessageType) => void;
  stickers: string[];
  currentStickerPage: number;
  totalStickerPages: number;
  onStickerPageChange: (newPage: number) => void;
  currentUserId: string;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSendMessage, 
  stickers,
  currentStickerPage,
  totalStickerPages,
  onStickerPageChange,
  currentUserId
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text, MessageType.TEXT);
    setText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUserId) {
        setUploading(true);
        try {
            // 1. Upload File
            const fileUrl = await api.uploadFile(currentUserId, file);
            // 2. Send Message with URL
            onSendMessage(fileUrl, MessageType.IMAGE);
        } catch (e) {
            console.error("Upload failed", e);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-[200px] border-t border-[#d6d6d6] bg-[#f5f5f5] flex flex-col relative z-20">
      {/* Toolbar */}
      <div className="h-10 px-4 flex items-center gap-5 text-[#555]">
        {/* Emoji Button */}
        <div className="relative">
          <button 
            onClick={() => {
                setShowEmojiPicker(!showEmojiPicker); 
                setShowStickerPicker(false);
            }} 
            className="hover:text-black"
          >
            <i className="far fa-smile text-xl"></i>
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-10 left-[-10px] w-72 h-48 bg-white shadow-xl border rounded-md overflow-y-auto p-2 grid grid-cols-6 gap-2 z-50">
              {EMOJIS.map((emoji) => (
                <button 
                  key={emoji} 
                  className="text-xl hover:bg-gray-100 rounded p-1"
                  onClick={() => {
                    setText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                    textareaRef.current?.focus();
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sticker Button */}
         <div className="relative">
          <button 
            onClick={() => {
                setShowStickerPicker(!showStickerPicker); 
                setShowEmojiPicker(false);
            }} 
            className="hover:text-black"
          >
            <i className="far fa-heart text-xl"></i>
          </button>
          
          {showStickerPicker && (
            <div className="absolute bottom-10 left-[-50px] w-80 bg-white shadow-xl border rounded-md p-2 flex flex-col z-50">
              {/* Sticker Grid (4x3 = 12 items) */}
              <div className="flex-1 grid grid-cols-4 grid-rows-3 gap-2 min-h-[240px]">
                {stickers.map((sticker: string, idx: number) => (
                    <button 
                    key={idx} 
                    className="hover:bg-gray-100 rounded p-1 flex items-center justify-center border border-transparent hover:border-gray-200"
                    onClick={() => {
                        onSendMessage(sticker, MessageType.STICKER);
                        setShowStickerPicker(false);
                    }}
                    >
                    <img src={sticker} alt="Sticker" className="w-16 h-16 object-contain" />
                    </button>
                ))}
                {stickers.length === 0 && <div className="col-span-4 row-span-3 flex items-center justify-center text-gray-400 text-sm">Loading...</div>}
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t pt-2 mt-2 px-2 text-xs text-gray-600">
                  <button 
                    disabled={currentStickerPage <= 1}
                    onClick={() => onStickerPageChange(currentStickerPage - 1)}
                    className="p-1 hover:text-black disabled:text-gray-300"
                  >
                      <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  <span>{currentStickerPage} / {totalStickerPages || 1}</span>
                  
                  <button 
                    disabled={currentStickerPage >= totalStickerPages}
                    onClick={() => onStickerPageChange(currentStickerPage + 1)}
                    className="p-1 hover:text-black disabled:text-gray-300"
                  >
                      <i className="fas fa-chevron-right"></i>
                  </button>
              </div>
            </div>
          )}
        </div>

        {/* File Upload */}
        <button onClick={() => fileInputRef.current?.click()} className="hover:text-black" disabled={uploading}>
          {uploading ? <i className="fas fa-spinner fa-spin text-xl"></i> : <i className="far fa-folder text-xl"></i>}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileUpload}
        />

        <button className="hover:text-black">
            <i className="fas fa-cut text-xl"></i>
        </button>

        <button className="hover:text-black">
            <i className="far fa-comment-dots text-xl"></i>
        </button>
      </div>

      {/* Input Field */}
      <div className="flex-1 px-4 py-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent resize-none border-none outline-none text-[15px] font-sans"
          placeholder=""
        />
      </div>

      {/* Send Button */}
      <div className="h-12 flex items-center justify-end px-4 pb-2">
        <span className="text-gray-400 text-xs mr-4">Press Enter to send</span>
        <button 
          onClick={handleSend}
          disabled={!text.trim()}
          className={`px-6 py-1.5 rounded-sm text-sm border ${
            text.trim() 
              ? 'bg-[#e9e9e9] text-[#07c160] hover:bg-[#d2d2d2] border-[#e9e9e9]' 
              : 'bg-[#e9e9e9] text-gray-400 border-[#e9e9e9] cursor-default'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default InputArea;