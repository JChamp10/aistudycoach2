const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function getBackendBaseUrl() {
  return API.replace(/\/api\/?$/, '');
}

export function getAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  if (/^https?:\/\//i.test(avatarUrl) || avatarUrl.startsWith('data:')) return avatarUrl;
  if (avatarUrl.startsWith('/')) return `${getBackendBaseUrl()}${avatarUrl}`;
  return `${getBackendBaseUrl()}/${avatarUrl}`;
}
