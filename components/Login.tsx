import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('alice'); 
  const [password, setPassword] = useState('123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for Secure Context (Required for Web Crypto API)
  useEffect(() => {
    if (!window.crypto || !window.crypto.subtle) {
      setError("Critical Error: Web Crypto API is unavailable. Please use localhost or HTTPS.");
    }
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setIsLoading(true);
    setError('');

    try {
        const data = await api.login(username, password);
        onLoginSuccess(data.user);
    } catch (e: any) {
        console.error(e);
        if (e.message === 'Invalid credentials') {
            setError('Incorrect username or password.');
        } else if (e.message === 'Account locked') {
            setError('This account has been locked.');
        } else {
            setError('Login failed. Please try again.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f5f5f5] p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <div className="text-center mb-6">
          <i className="fas fa-lock text-5xl text-[#07c160] mb-4"></i>
          <h1 className="text-2xl font-semibold text-gray-800">Secure Chat</h1>
          <p className="text-gray-500 text-sm mt-2">RSA-2048 Asymmetric Encryption</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#07c160]"
              placeholder="Username"
            />
          </div>

          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
             <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#07c160]"
              placeholder="Password"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

          <button 
            onClick={handleLogin}
            disabled={isLoading || !!error}
            className={`w-full py-2 rounded-md font-medium text-white transition-colors mt-2 flex justify-center items-center ${
                isLoading || error ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#07c160] hover:bg-[#06ad56]'
            }`}
          >
            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Log In'}
          </button>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-400">
           Demo Credentials (ID starts at 10001):<br/>alice / 123<br/>bob / 123
        </div>
      </div>
    </div>
  );
};

export default Login;