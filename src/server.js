const http = require('http');
const fs = require('fs');
const path = require('path');

const fsPromises = fs.promises;

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(__dirname, 'public');
const MIME_TYPES = {
  '.css': 'text/css; charset=UTF-8',
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=UTF-8'
};

loadEnv(path.join(ROOT_DIR, '.env'));

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

const ALLOWED_ORDERS = new Set(['date', 'rating', 'relevance', 'title', 'videoCount', 'viewCount']);
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const server = http.createServer((req, res) => {
  routeRequest(req, res).catch((error) => {
    console.error('Unexpected error while handling request:', error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Internal server error.' });
    } else {
      res.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`YouTube API web server listening on http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn('Warning: YOUTUBE_API_KEY is not set. API requests will fail until you provide a valid key.');
  }
});

async function routeRequest(req, res) {
  const method = req.method.toUpperCase();
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (pathname.startsWith('/api/')) {
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        ...CORS_HEADERS,
        'Content-Length': '0'
      });
      res.end();
      return;
    }

    if (pathname === '/api/search') {
      if (method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed. Use GET for this endpoint.' }, CORS_HEADERS);
        return;
      }
      await handleSearch(res, requestUrl.searchParams);
      return;
    }

    sendJson(res, 404, { error: 'Endpoint not found.' }, CORS_HEADERS);
    return;
  }

  if (method !== 'GET' && method !== 'HEAD') {
    sendText(res, 405, 'Method not allowed.');
    return;
  }

  await serveStatic(res, pathname, method === 'HEAD');
}

async function handleSearch(res, params) {
  if (!API_KEY) {
    sendJson(res, 500, { error: 'Server configuration error: missing YOUTUBE_API_KEY environment variable.' }, CORS_HEADERS);
    return;
  }

  const rawQuery = (params.get('q') || '').trim();
  if (!rawQuery) {
    sendJson(res, 400, { error: 'Missing required query parameter "q".' }, CORS_HEADERS);
    return;
  }

  const pageToken = (params.get('pageToken') || '').trim();
  const regionCode = (params.get('regionCode') || '').trim();
  const orderParam = (params.get('order') || '').trim();
  const maxResultsParam = params.get('maxResults');

  let maxResults = 12;
  if (maxResultsParam) {
    const parsed = Number.parseInt(maxResultsParam, 10);
    if (!Number.isNaN(parsed)) {
      maxResults = Math.min(Math.max(parsed, 1), 25);
    }
  }

  const searchParams = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: rawQuery,
    maxResults: String(maxResults),
    key: API_KEY,
    safeSearch: 'moderate'
  });

  if (pageToken) {
    searchParams.set('pageToken', pageToken);
  }

  if (regionCode) {
    searchParams.set('regionCode', regionCode);
  }

  if (orderParam && ALLOWED_ORDERS.has(orderParam)) {
    searchParams.set('order', orderParam);
  }

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`;

  let searchResponse;
  try {
    searchResponse = await fetchJson(searchUrl);
  } catch (error) {
    handleApiError(res, error, 'search');
    return;
  }

  const videoItems = Array.isArray(searchResponse.items)
    ? searchResponse.items.filter((item) => item && item.id && item.id.videoId && item.snippet)
    : [];

  const videoIds = videoItems.map((item) => item.id.videoId);

  const statsMap = new Map();
  if (videoIds.length > 0) {
    const videosParams = new URLSearchParams({
      part: 'contentDetails,statistics',
      id: videoIds.join(','),
      key: API_KEY
    });
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`;
    try {
      const videosResponse = await fetchJson(videosUrl);
      if (Array.isArray(videosResponse.items)) {
        for (const item of videosResponse.items) {
          if (!item || !item.id) continue;
          statsMap.set(item.id, {
            statistics: item.statistics || {},
            contentDetails: item.contentDetails || {}
          });
        }
      }
    } catch (error) {
      console.warn('Unable to fetch additional video details:', error.message);
    }
  }

  const results = videoItems.map((item) => {
    const videoId = item.id.videoId;
    const snippet = item.snippet || {};
    const extra = statsMap.get(videoId) || {};
    const statistics = extra.statistics || {};
    const contentDetails = extra.contentDetails || {};

    return {
      id: videoId,
      title: snippet.title || '',
      description: snippet.description || '',
      channelId: snippet.channelId || '',
      channelTitle: snippet.channelTitle || '',
      publishedAt: snippet.publishedAt || null,
      thumbnailUrl: selectThumbnail(snippet.thumbnails),
      thumbnails: snippet.thumbnails || {},
      viewCount: parseApiNumber(statistics.viewCount),
      likeCount: parseApiNumber(statistics.likeCount),
      commentCount: parseApiNumber(statistics.commentCount),
      duration: contentDetails.duration || null
    };
  });

  sendJson(
    res,
    200,
    {
      query: rawQuery,
      nextPageToken: searchResponse.nextPageToken || null,
      prevPageToken: searchResponse.prevPageToken || null,
      pageInfo: searchResponse.pageInfo || null,
      regionCode: searchResponse.regionCode || null,
      items: results
    },
    CORS_HEADERS
  );
}

async function serveStatic(res, pathname, isHeadRequest) {
  let resourcePath = pathname;
  if (resourcePath === '/') {
    resourcePath = '/index.html';
  } else if (resourcePath.endsWith('/')) {
    resourcePath += 'index.html';
  }

  const normalizedPath = path.normalize(resourcePath).replace(/^([.]{2,}[\/])+/, '');
  const withoutLeadingSlash = normalizedPath.startsWith(path.sep)
    ? normalizedPath.slice(1)
    : normalizedPath;
  const absolutePath = path.resolve(PUBLIC_DIR, withoutLeadingSlash);

  if (!absolutePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  try {
    const stats = await fsPromises.stat(absolutePath);
    if (stats.isDirectory()) {
      sendText(res, 404, 'Not Found');
      return;
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Last-Modified': stats.mtime.toUTCString(),
      'X-Content-Type-Options': 'nosniff'
    };

    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    res.writeHead(200, headers);

    if (isHeadRequest) {
      res.end();
      return;
    }

    const readStream = fs.createReadStream(absolutePath);
    readStream.on('error', (error) => {
      console.error('Error streaming static file:', error);
      if (!res.headersSent) {
        sendText(res, 500, 'Internal server error while reading file.');
      } else {
        res.destroy(error);
      }
    });
    readStream.pipe(res);
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendText(res, 404, 'Not Found');
    } else {
      console.error('Failed to serve static asset:', error);
      sendText(res, 500, 'Internal server error.');
    }
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`YouTube API responded with status ${response.status}: ${errorText}`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('The request to the YouTube API timed out.');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function handleApiError(res, error, stage) {
  const status = error.status && Number.isInteger(error.status) ? error.status : 502;
  let message = 'Unable to fetch data from the YouTube API.';
  if (status === 403) {
    message = 'The YouTube API rejected the request. Check your API key, quota limits, or permissions.';
  } else if (status === 401) {
    message = 'Authentication with the YouTube API failed. Verify your API key.';
  } else if (status === 404) {
    message = 'The requested data could not be found in the YouTube API.';
  } else if (status === 504) {
    message = 'The YouTube API request timed out. Please try again.';
  }

  console.error(`YouTube API error during ${stage} stage:`, error.message);
  sendJson(
    res,
    status >= 400 && status < 600 ? status : 502,
    {
      error: message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    CORS_HEADERS
  );
}

function selectThumbnail(thumbnails = {}) {
  if (thumbnails.high && thumbnails.high.url) return thumbnails.high.url;
  if (thumbnails.medium && thumbnails.medium.url) return thumbnails.medium.url;
  if (thumbnails.standard && thumbnails.standard.url) return thumbnails.standard.url;
  if (thumbnails.default && thumbnails.default.url) return thumbnails.default.url;
  return null;
}

function parseApiNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  res.end(body);
}

function sendText(res, statusCode, message, contentType = 'text/plain; charset=UTF-8') {
  const body = message || '';
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function loadEnv(envPath) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;
      const key = trimmed.slice(0, equalsIndex).trim();
      if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;
      const value = trimmed.slice(equalsIndex + 1).trim();
      process.env[key] = value.replace(/(^['"]|['"]$)/g, '');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Could not read environment file at ${envPath}:`, error.message);
    }
  }
}
