'use strict';

const state = {
  query: '',
  nextPageToken: null,
  prevPageToken: null,
  items: [],
  isLoading: false
};

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchButton = searchForm?.querySelector('button[type="submit"]');
const resultsContainer = document.getElementById('results');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const statusMessage = document.getElementById('status');
const overlay = document.getElementById('overlay');
const closeOverlayButton = document.getElementById('close-overlay');
const videoPlayer = document.getElementById('video-player');
const videoDetails = document.getElementById('video-details');
const resultTemplate = document.getElementById('result-template');

let lastFocusedElement = null;
const viewCountFormatter = createViewFormatter();
const dateFormatter = createDateFormatter();

if (searchInput) {
  searchInput.focus({ preventScroll: true });
}

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput?.value.trim() ?? '';
  if (query.length < 2) {
    setStatus('검색어는 두 글자 이상 입력해 주세요.', true);
    return;
  }
  performSearch(query);
});

prevButton?.addEventListener('click', () => {
  if (state.prevPageToken && !state.isLoading) {
    performSearch(state.query, state.prevPageToken);
  }
});

nextButton?.addEventListener('click', () => {
  if (state.nextPageToken && !state.isLoading) {
    performSearch(state.query, state.nextPageToken);
  }
});

closeOverlayButton?.addEventListener('click', closeOverlay);
overlay?.addEventListener('click', (event) => {
  if (event.target === overlay) {
    closeOverlay();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !overlay?.classList.contains('hidden')) {
    closeOverlay();
  }
});

async function performSearch(query, pageToken = '') {
  const trimmedQuery = (query ?? '').trim();
  if (!trimmedQuery) {
    setStatus('검색어를 입력해 주세요.', true);
    return;
  }

  const params = new URLSearchParams({ q: trimmedQuery });
  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  setLoading(true);
  setStatus(`"${trimmedQuery}" 검색 중입니다…`);

  try {
    const response = await fetch(`/api/search?${params.toString()}`);
    const contentType = response.headers.get('content-type') ?? '';
    let payload = null;
    if (contentType.includes('application/json')) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      const message = typeof payload === 'object' && payload && payload.error
        ? payload.error
        : '검색 중 오류가 발생했습니다.';
      throw new Error(message);
    }

    handleSearchResponse(payload, trimmedQuery);
  } catch (error) {
    console.error('Search failed:', error);
    setStatus(error.message || '검색 중 알 수 없는 오류가 발생했습니다.', true);
    renderResults([]);
  } finally {
    setLoading(false);
  }
}

function handleSearchResponse(data, query) {
  if (!data || typeof data !== 'object') {
    setStatus('서버 응답을 해석할 수 없습니다.', true);
    renderResults([]);
    return;
  }

  const items = Array.isArray(data.items) ? data.items : [];
  state.query = query;
  state.items = items;
  state.nextPageToken = data.nextPageToken || null;
  state.prevPageToken = data.prevPageToken || null;

  const totalResults = typeof data.pageInfo?.totalResults === 'number' ? data.pageInfo.totalResults : null;

  document.title = state.query ? `${state.query} - YouTube Explorer` : 'YouTube Explorer';

  renderResults(items);
  updatePagination();

  if (items.length > 0) {
    const segments = [`"${state.query}"에 대한 ${items.length}개의 결과를 표시합니다.`];
    if (totalResults !== null) {
      segments.push(`총 ${totalResults.toLocaleString()}개 중 일부입니다.`);
    }
    setStatus(segments.join(' '));
  } else {
    setStatus(`"${state.query}"에 대한 결과를 찾지 못했습니다. 다른 검색어를 시도해 보세요.`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderResults(items) {
  if (!resultsContainer) return;
  resultsContainer.innerHTML = '';

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '표시할 검색 결과가 없습니다.';
    resultsContainer.appendChild(empty);
    resultsContainer.setAttribute('aria-busy', 'false');
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const card = createResultCard(item);
    fragment.appendChild(card);
  }
  resultsContainer.appendChild(fragment);
  resultsContainer.setAttribute('aria-busy', 'false');
}

function createResultCard(item) {
  const node = resultTemplate?.content?.firstElementChild?.cloneNode(true);
  const card = node ?? document.createElement('article');
  card.classList.add('video-card');

  const thumbnailButton = card.querySelector('.thumbnail-button');
  const thumbnail = card.querySelector('.thumbnail');
  const titleLink = card.querySelector('.title-link');
  const channel = card.querySelector('.channel');
  const meta = card.querySelector('.meta');
  const description = card.querySelector('.description');

  const titleText = (item.title || '제목 미정').trim();
  const channelText = (item.channelTitle || '알 수 없는 채널').trim();
  const descriptionText = sanitizeDescription(item.description || '');

  if (thumbnail) {
    if (item.thumbnailUrl) {
      thumbnail.src = item.thumbnailUrl;
    } else {
      thumbnail.removeAttribute('src');
    }
    thumbnail.alt = `${titleText} 썸네일`;
  }

  const openVideo = () => openOverlay(item);

  if (thumbnailButton) {
    thumbnailButton.addEventListener('click', openVideo);
  }

  if (titleLink) {
    titleLink.textContent = titleText;
    titleLink.addEventListener('click', (event) => {
      event.preventDefault();
      openVideo();
    });
  }

  if (channel) {
    channel.textContent = channelText;
  }

  if (meta) {
    const metaParts = [formatViews(item.viewCount), formatPublishedDate(item.publishedAt), formatDuration(item.duration)].filter(Boolean);
    meta.textContent = metaParts.join(' · ');
  }

  if (description) {
    description.textContent = truncate(descriptionText, 180);
  }

  return card;
}

function openOverlay(item) {
  if (!overlay || !videoPlayer || !videoDetails) return;

  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');

  const videoUrl = `https://www.youtube.com/embed/${encodeURIComponent(item.id)}?rel=0&autoplay=1`;
  videoPlayer.src = videoUrl;

  populateVideoDetails(item);
  closeOverlayButton?.focus({ preventScroll: true });
}

function closeOverlay() {
  if (!overlay || !videoPlayer || !videoDetails) return;

  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  videoPlayer.src = '';
  videoDetails.innerHTML = '';

  if (lastFocusedElement) {
    lastFocusedElement.focus({ preventScroll: true });
    lastFocusedElement = null;
  }
}

function populateVideoDetails(item) {
  if (!videoDetails) return;
  videoDetails.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = item.title || '제목 미정';

  const channel = document.createElement('p');
  channel.className = 'channel';
  channel.textContent = item.channelTitle || '알 수 없는 채널';

  const meta = document.createElement('p');
  meta.className = 'meta';
  const metaParts = [formatViews(item.viewCount), formatPublishedDate(item.publishedAt), formatDuration(item.duration)].filter(Boolean);
  meta.textContent = metaParts.join(' · ');

  const description = document.createElement('p');
  description.className = 'description';
  description.textContent = (item.description || '설명이 제공되지 않았습니다.').trim();

  const link = document.createElement('a');
  link.className = 'watch-link';
  link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'YouTube에서 열기 ↗';

  videoDetails.append(title, channel, meta, description, link);
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  resultsContainer?.setAttribute('aria-busy', String(isLoading));
  if (searchInput) {
    searchInput.disabled = isLoading;
  }
  if (searchButton) {
    searchButton.disabled = isLoading;
  }
  updatePagination();
}

function updatePagination() {
  if (prevButton) {
    prevButton.disabled = state.isLoading || !state.prevPageToken;
  }
  if (nextButton) {
    nextButton.disabled = state.isLoading || !state.nextPageToken;
  }
}

function setStatus(message, isError = false) {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', Boolean(isError));
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function sanitizeDescription(text) {
  return text.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function formatViews(count) {
  if (count === null || count === undefined) return null;
  const numeric = typeof count === 'number' ? count : Number(count);
  if (Number.isNaN(numeric)) {
    return null;
  }

  if (viewCountFormatter) {
    return `${viewCountFormatter.format(numeric)} 조회수`;
  }

  return `${numeric.toLocaleString()} 조회수`;
}

function formatPublishedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (dateFormatter) {
    return dateFormatter.format(date);
  }
  return date.toLocaleDateString();
}

function formatDuration(duration) {
  if (!duration) return null;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
  if (!match) return null;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  return `0:${String(seconds).padStart(2, '0')}`;
}

function createViewFormatter() {
  try {
    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      compactDisplay: 'short'
    });
  } catch (error) {
    return null;
  }
}

function createDateFormatter() {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return null;
  }
}
