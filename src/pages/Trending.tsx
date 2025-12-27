import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { YouTubeApiService } from '../services/youtubeApi';
import { Channel } from '../types';
import ChannelCard from '../components/ChannelCard';
import Navbar from '../components/Navbar';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { countries } from '../utils/countries';

const Trending: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('KR');

  const loadTrendingChannels = async (country: string) => {
    if (!user?.apiKey) {
      setError('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setChannels([]);

    try {
      const api = new YouTubeApiService(user.apiKey);
      const results = await api.getTrendingChannels(country, 15);
      setChannels(results);

      if (results.length === 0) {
        setError('트렌딩 채널을 찾을 수 없습니다.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('트렌딩 채널을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.apiKey) {
      loadTrendingChannels(selectedCountry);
    }
  }, [selectedCountry, user?.apiKey]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-800">트렌딩 채널</h1>
        </div>

        <p className="text-gray-600 mb-6">
          최근 인기 동영상을 업로드한 채널들을 확인해보세요.
        </p>

        {!user?.apiKey && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium">API 키가 설정되지 않았습니다.</p>
              <p className="text-yellow-700 text-sm mt-1">
                YouTube API를 사용하려면{' '}
                <button
                  onClick={() => navigate('/settings')}
                  className="underline hover:text-yellow-900"
                >
                  설정 페이지
                </button>
                에서 API 키를 입력해주세요.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            국가 선택
          </label>
          <select
            id="country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
          >
            {countries
              .filter((c) => c.code !== '')
              .map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        )}

        {!isLoading && channels.length > 0 && (
          <>
            <div className="mb-4 text-gray-600">
              <span className="font-semibold">{channels.length}개</span>의 트렌딩 채널을 찾았습니다.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Trending;
