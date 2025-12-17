import React, { useState, useRef } from 'react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onSaveProfile: (name: string, avatar: string) => void;
  onSaveAppearance: (sidebarWallpaper: string, chatWallpaper: string) => void;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onSaveProfile, onSaveAppearance, onClose }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [sidebarWallpaper, setSidebarWallpaper] = useState(user.sidebarWallpaper || '');
  const [chatWallpaper, setChatWallpaper] = useState(user.chatWallpaper || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance'>('profile');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const sidebarInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setter(ev.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = () => {
      if (activeTab === 'profile') {
          onSaveProfile(name, avatar);
      } else {
          onSaveAppearance(sidebarWallpaper, chatWallpaper);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="flex border-b border-gray-100">
            <button 
                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'profile' ? 'text-[#07c160] border-b-2 border-[#07c160]' : 'text-gray-500'}`}
                onClick={() => setActiveTab('profile')}
            >
                Profile
            </button>
            <button 
                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'appearance' ? 'text-[#07c160] border-b-2 border-[#07c160]' : 'text-gray-500'}`}
                onClick={() => setActiveTab('appearance')}
            >
                Appearance
            </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
          {activeTab === 'profile' ? (
              <>
                <div className="flex flex-col items-center mb-4 gap-2">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        <img src={avatar} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                        <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fas fa-camera text-white"></i>
                        </div>
                    </div>
                    <span className="text-xs text-[#576b95] cursor-pointer" onClick={() => avatarInputRef.current?.click()}>Change Avatar</span>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatar)} />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Display Name</label>
                    <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#07c160] outline-none"
                    />
                </div>
              </>
          ) : (
              <>
                 {/* Sidebar Wallpaper */}
                 <div className="space-y-2">
                     <label className="block text-xs font-semibold text-gray-500">Contact List Background</label>
                     <div className="flex gap-2 items-center">
                         <div 
                             className="w-16 h-24 border border-gray-200 rounded bg-gray-100 cursor-pointer overflow-hidden relative"
                             onClick={() => sidebarInputRef.current?.click()}
                         >
                             {sidebarWallpaper ? (
                                 <img src={sidebarWallpaper} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="flex items-center justify-center h-full text-gray-400 text-xs">None</div>
                             )}
                         </div>
                         <div className="flex flex-col gap-1">
                             <button onClick={() => sidebarInputRef.current?.click()} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Upload Image</button>
                             {sidebarWallpaper && <button onClick={() => setSidebarWallpaper('')} className="text-xs text-red-500 hover:underline">Remove</button>}
                         </div>
                         <input type="file" ref={sidebarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setSidebarWallpaper)} />
                     </div>
                 </div>

                 {/* Chat Wallpaper */}
                 <div className="space-y-2 mt-4">
                     <label className="block text-xs font-semibold text-gray-500">Chat Background</label>
                     <div className="flex gap-2 items-center">
                         <div 
                             className="w-16 h-24 border border-gray-200 rounded bg-gray-100 cursor-pointer overflow-hidden relative"
                             onClick={() => chatInputRef.current?.click()}
                         >
                             {chatWallpaper ? (
                                 <img src={chatWallpaper} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="flex items-center justify-center h-full text-gray-400 text-xs">None</div>
                             )}
                         </div>
                         <div className="flex flex-col gap-1">
                             <button onClick={() => chatInputRef.current?.click()} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Upload Image</button>
                             {chatWallpaper && <button onClick={() => setChatWallpaper('')} className="text-xs text-red-500 hover:underline">Remove</button>}
                         </div>
                         <input type="file" ref={chatInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setChatWallpaper)} />
                     </div>
                 </div>
              </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-1.5 text-sm bg-[#07c160] text-white rounded hover:bg-[#06ad56]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;