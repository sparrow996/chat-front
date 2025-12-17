import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AddFriendModalProps {
  currentUserId: string;
  onFriendAdded: () => void;
  onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ currentUserId, onFriendAdded, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);

    try {
        const users = await api.searchUsers(currentUserId, searchQuery);
        setResults(users);
        if (users.length === 0) setError('No users found.');
    } catch (e) {
        setError('Search failed.');
    } finally {
        setLoading(false);
    }
  };

  const handleAdd = async (userId: string) => {
      try {
          await api.addFriend(currentUserId, userId);
          onFriendAdded(); // Close and Refresh
      } catch (e) {
          alert('Failed to add friend');
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-xl overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">Add Friend</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded focus:border-[#07c160] outline-none"
              placeholder="Search by ID or Name"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="px-4 py-2 bg-[#07c160] text-white rounded hover:bg-[#06ad56] whitespace-nowrap"
            >
              Search
            </button>
          </div>
          
          {loading && <p className="text-center text-gray-400 text-xs"><i className="fas fa-spinner fa-spin"></i> Searching...</p>}
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          
          <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
              {results.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                          <img src={u.avatar} className="w-8 h-8 rounded bg-gray-300 object-cover"/>
                          <div>
                              <div className="text-sm font-medium">{u.name}</div>
                              <div className="text-xs text-gray-500">{u.id}</div>
                          </div>
                      </div>
                      <button 
                        onClick={() => handleAdd(u.id)}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100"
                      >
                          Add
                      </button>
                  </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;