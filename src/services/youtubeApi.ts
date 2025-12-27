import axios from 'axios';
import { Channel, SearchFilters, YouTubeChannel } from '../types';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export class YouTubeApiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchChannels(filters: SearchFilters): Promise<Channel[]> {
    try {
      const { keyword, country, sortBy, maxResults } = filters;

      // Search for channels
      const searchResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
        params: {
          key: this.apiKey,
          part: 'snippet',
          type: 'channel',
          q: keyword,
          regionCode: country || undefined,
          order: sortBy === 'subscriberCount' ? 'relevance' : sortBy,
          maxResults: maxResults,
        },
      });

      const channelIds = searchResponse.data.items.map((item: any) => item.id.channelId);

      if (channelIds.length === 0) {
        return [];
      }

      // Get detailed channel information
      const channelsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
        params: {
          key: this.apiKey,
          part: 'snippet,statistics',
          id: channelIds.join(','),
        },
      });

      const channels: Channel[] = channelsResponse.data.items.map((item: YouTubeChannel) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        subscriberCount: parseInt(item.statistics.subscriberCount) || 0,
        videoCount: parseInt(item.statistics.videoCount) || 0,
        viewCount: parseInt(item.statistics.viewCount) || 0,
        publishedAt: item.snippet.publishedAt,
        country: item.snippet.country,
        customUrl: item.snippet.customUrl,
      }));

      // Sort by subscriber count if requested
      if (sortBy === 'subscriberCount') {
        channels.sort((a, b) => b.subscriberCount - a.subscriberCount);
      }

      return channels;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid API key or quota exceeded');
        }
        throw new Error(error.response?.data?.error?.message || 'Failed to search channels');
      }
      throw error;
    }
  }

  async getChannelById(channelId: string): Promise<Channel | null> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
        params: {
          key: this.apiKey,
          part: 'snippet,statistics',
          id: channelId,
        },
      });

      if (response.data.items.length === 0) {
        return null;
      }

      const item: YouTubeChannel = response.data.items[0];
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        subscriberCount: parseInt(item.statistics.subscriberCount) || 0,
        videoCount: parseInt(item.statistics.videoCount) || 0,
        viewCount: parseInt(item.statistics.viewCount) || 0,
        publishedAt: item.snippet.publishedAt,
        country: item.snippet.country,
        customUrl: item.snippet.customUrl,
      };
    } catch (error) {
      console.error('Error fetching channel:', error);
      return null;
    }
  }

  async getTrendingChannels(country: string = 'US', maxResults: number = 10): Promise<Channel[]> {
    try {
      // Get trending videos first
      const videosResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
        params: {
          key: this.apiKey,
          part: 'snippet',
          chart: 'mostPopular',
          regionCode: country,
          maxResults: maxResults * 2,
        },
      });

      // Extract unique channel IDs
      const channelIds = [...new Set(
        videosResponse.data.items.map((item: any) => item.snippet.channelId)
      )].slice(0, maxResults);

      if (channelIds.length === 0) {
        return [];
      }

      // Get channel details
      const channelsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
        params: {
          key: this.apiKey,
          part: 'snippet,statistics',
          id: channelIds.join(','),
        },
      });

      const channels: Channel[] = channelsResponse.data.items.map((item: YouTubeChannel) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        subscriberCount: parseInt(item.statistics.subscriberCount) || 0,
        videoCount: parseInt(item.statistics.videoCount) || 0,
        viewCount: parseInt(item.statistics.viewCount) || 0,
        publishedAt: item.snippet.publishedAt,
        country: item.snippet.country,
        customUrl: item.snippet.customUrl,
      }));

      return channels;
    } catch (error) {
      console.error('Error fetching trending channels:', error);
      throw error;
    }
  }
}
