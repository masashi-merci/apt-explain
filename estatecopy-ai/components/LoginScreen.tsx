import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => void;
  loginError: string | null;
  isLoading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loginError, isLoading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onLogin(username, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">EstateCopy AI</h1>
          <p className="text-sm text-gray-500 mt-2">不動産コピーライティング支援システム</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-200">
              {loginError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              ログインID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-gray-900"
              placeholder="IDを入力"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-gray-900"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white py-3 rounded-lg font-bold transition-colors shadow-md flex justify-center items-center
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Powered by milztech
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-300 border-t pt-4">
          <p>開発者用初期アカウント: milztech / admin</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;