import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Key, Save, AlertCircle, CheckCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, updateApiKey } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.apiKey) {
      setApiKey(user.apiKey);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'API 키를 입력해주세요.' });
      return;
    }

    updateApiKey(apiKey);
    setMessage({ type: 'success', text: 'API 키가 성공적으로 저장되었습니다.' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Key className="w-6 h-6 text-red-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">API 설정</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">YouTube API 키 발급 방법</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Google Cloud Console에 접속합니다</li>
            <li>새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다</li>
            <li>"API 및 서비스" &gt; "사용자 인증 정보"로 이동합니다</li>
            <li>"사용자 인증 정보 만들기" &gt; "API 키"를 선택합니다</li>
            <li>YouTube Data API v3를 활성화합니다</li>
            <li>생성된 API 키를 복사하여 아래에 입력합니다</li>
          </ol>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-blue-600 hover:text-blue-700 underline text-sm"
          >
            Google Cloud Console 열기 →
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Data API v3 키
            </label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
              placeholder="AIzaSy..."
            />
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            저장
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>주의:</strong> API 키는 브라우저의 로컬 스토리지에 저장됩니다.
            공용 컴퓨터에서는 사용을 주의하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
