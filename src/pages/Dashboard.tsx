import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { YouTubeApiService } from '../services/youtubeApi';
import { Channel, SearchFilters } from '../types';
import SearchBar from '../components/SearchBar';
import ChannelCard from '../components/ChannelCard';
import Navbar from '../components/Navbar';
import { AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    country: '',
    sortBy: 'relevance',
    maxResults: 20,
  });

  const handleSearch = async () => {
    if (!user?.apiKey) {
      setError('API 키를 먼저 설정해주세요.');
      navigate('/settings');
      return;
    }

    if (!filters.keyword.trim()) {
      setError('검색 키워드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setChannels([]);

    try {
      const api = new YouTubeApiService(user.apiKey);
      const results = await api.searchChannels(filters);
      setChannels(results);

      if (results.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('채널 검색 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">채널 검색</h1>

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

        <SearchBar
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          isLoading={isLoading}
        />

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
              <span className="font-semibold">{channels.length}개</span>의 채널을 찾았습니다.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </>
        )}

        {!isLoading && channels.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              키워드를 입력하여 YouTube 채널을 검색해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
