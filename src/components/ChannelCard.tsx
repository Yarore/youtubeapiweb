import React from 'react';
import { Channel } from '../types';
import { Users, Video, Eye, Calendar } from 'lucide-react';

interface ChannelCardProps {
  channel: Channel;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={channel.thumbnailUrl}
            alt={channel.title}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{channel.title}</h3>
            {channel.customUrl && (
              <p className="text-sm text-gray-500 mb-2">@{channel.customUrl}</p>
            )}
            {channel.country && (
              <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                {channel.country}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{channel.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-xs text-gray-500">구독자</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatNumber(channel.subscriberCount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-xs text-gray-500">동영상</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatNumber(channel.videoCount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-xs text-gray-500">총 조회수</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatNumber(channel.viewCount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-xs text-gray-500">개설일</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDate(channel.publishedAt).split(' ')[0]}
              </p>
            </div>
          </div>
        </div>

        <a
          href={`https://www.youtube.com/channel/${channel.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block w-full text-center bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition duration-200"
        >
          채널 방문
        </a>
      </div>
    </div>
  );
};

export default ChannelCard;
