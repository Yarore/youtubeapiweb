export interface User {
  username: string;
  apiKey: string;
}

export interface Channel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
  country?: string;
  customUrl?: string;
}

export interface SearchFilters {
  keyword: string;
  country: string;
  sortBy: 'relevance' | 'date' | 'viewCount' | 'subscriberCount';
  maxResults: number;
}

export interface ChannelStatistics {
  viewCount: string;
  subscriberCount: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
}

export interface ChannelSnippet {
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  country?: string;
}

export interface YouTubeChannel {
  kind: string;
  etag: string;
  id: string;
  snippet: ChannelSnippet;
  statistics: ChannelStatistics;
}
