export interface PostItem {
  id: string; name: string; avatar: string; color: string; verified: boolean;
  type: string; typeLabel: string; handle: string; meta: string; text: string;
  media: string | null; mediaLabel?: string | null; hashtags: string[];
  likes: number; comments: number; shares: number; liked: boolean; saved: boolean;
  replies: string[]; ownerDetails?: string[];
}
export interface ConversationItem {
  id: string; name: string; group: boolean; pinned: boolean; initials: string;
  color: string; message: string; time: string; unread: number;
}
export interface MessageItem { id: string; who: 'me' | 'them'; text: string; time: string; }
export interface OpportunityItem {
  id: string; title: string; organization: string; type: string; location: string;
  mode: string; deadline: string | null; tags: string[]; matchScore: number; summary: string;
}
export interface NotificationItem {
  id: string; kind: string; title: string; body: string; href: string | null;
  read: boolean; createdAt: string;
}
export interface ProfileItem {
  id: string; name: string; email: string; handle: string; initials: string;
  verified: boolean; verification: string; university: string | null;
  department: string | null; programme: string | null; level: number | null;
  bio: string | null; avatarUrl: string | null;
  posts: number; likes: number; answers: number; resources: number; saved: number;
}
export interface PublicProfileItem extends ProfileItem {
  followers: number; following: number; mutuals: string[];
  canMessage: boolean; followingYou: boolean; joined: string;
}
export interface SearchResult {
  people: PublicProfileItem[]; posts: PostItem[];
  opportunities: OpportunityItem[]; resources: { id: string; title: string; courseCode: string; type: string; sizeLabel: string | null }[];
}

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? '';
let cachedUserId: string | null = null;
async function currentUserId(): Promise<string> {
  if (!cachedUserId) cachedUserId = (await api<{ id: string }>('/content/me')).id;
  return cachedUserId;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = 'ApiError'; }
}

async function api<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}/api/v1${path}`, {
      credentials: 'include', ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new ApiError(0, error instanceof Error ? error.message : 'Network request failed');
  }
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    const refreshed = await fetch(`${API_ORIGIN}/api/v1/auth/refresh`, {
      method: 'POST', credentials: 'include', signal: AbortSignal.timeout(10_000),
    });
    if (refreshed.ok) return api<T>(path, init, false);
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json() as { message?: string | string[] };
      if (body.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch { /* keep generic message */ }
    throw new ApiError(response.status, message);
  }
  const json = await response.json() as unknown;
  if (json && typeof json === 'object' && 'data' in json) return (json as { data: T }).data;
  return json as T;
}

type ApiPost = {
  id: string; type: string; typeLabel: string; body: string;
  author: { name: string; handle: string; initials: string; verified: boolean };
  timestamp: string; likes: number; replies: number; liked: boolean; saved: boolean;
  hashtags: string[]; mediaKind?: string | null; mediaLabel?: string | null;
};
type ApiConversation = {
  id: string; name: string; isGroup: boolean; pinned: boolean;
  participants: { userId: string; user: { displayName: string } }[];
  messages: { body: string; createdAt: string }[];
};
type ApiMessage = { id: string; senderId: string; body: string; createdAt: string };
type ApiNotification = { id: string; kind: string; title: string; body: string; href: string | null; read: boolean; createdAt: string };
type ApiOpportunity = {
  id: string; title: string; organization: string; type: string; location: string; mode: string;
  deadline: string | null; tags: string[]; matchScore: number; summary: string;
};

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}
function timeLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}
function mapPost(post: ApiPost): PostItem {
  return {
    id: post.id, name: post.author.name, avatar: post.author.initials, color: 'violet',
    verified: post.author.verified, type: post.type, typeLabel: post.typeLabel,
    handle: post.author.handle, meta: timeLabel(post.timestamp), text: post.body,
    media: post.mediaKind ? post.mediaLabel ?? post.mediaKind : null,
    mediaLabel: post.mediaLabel, hashtags: post.hashtags ?? [],
    likes: post.likes, comments: post.replies, shares: 0,
    liked: post.liked, saved: post.saved, replies: [],
  };
}
function mapConversation(conversation: ApiConversation): ConversationItem {
  const last = conversation.messages?.[conversation.messages.length - 1];
  return {
    id: conversation.id, name: conversation.name,
    group: conversation.isGroup, pinned: conversation.pinned,
    initials: initials(conversation.name || 'Chat'), color: 'violet',
    message: last?.body ?? '', time: last ? timeLabel(last.createdAt) : '', unread: 0,
  };
}
function mapMessage(message: ApiMessage, viewerId: string): MessageItem {
  return {
    id: message.id, who: message.senderId === viewerId ? 'me' : 'them',
    text: message.body, time: timeLabel(message.createdAt),
  };
}
function mapNotification(notification: ApiNotification): NotificationItem {
  return { ...notification, createdAt: timeLabel(notification.createdAt) };
}
function mapOpportunity(opportunity: ApiOpportunity): OpportunityItem {
  return { ...opportunity, deadline: opportunity.deadline ? timeLabel(opportunity.deadline) : null };
}



export async function getFeed(tab?: string): Promise<PostItem[]> {
  return api<ApiPost[]>(`/content/feed?tab=${encodeURIComponent(tab ?? 'For You')}`).then((r) => r.map(mapPost));
}
export async function createPost(input: { text: string; type?: string; hashtags?: string[]; mediaKind?: string; mediaLabel?: string }): Promise<boolean> {
  await api<{ id: string }>('/content/posts', { method: 'POST', body: JSON.stringify({ body: input.text, type: input.type, hashtags: input.hashtags, mediaKind: input.mediaKind, mediaLabel: input.mediaLabel }) });
  return true;
}
export async function toggleLike(id: string): Promise<void> {
  await api(`/content/posts/${id}/like`, { method: 'POST' });
}
export async function toggleSave(id: string): Promise<void> {
  await api(`/content/posts/${id}/save`, { method: 'POST' });
}
export async function addReply(id: string, text: string): Promise<void> {
  await api(`/content/posts/${id}/reply`, { method: 'POST', body: JSON.stringify({ text }) });
}
export async function getConversations(): Promise<ConversationItem[]> {
  return api<ApiConversation[]>('/content/conversations').then((r) => r.map(mapConversation));
}
export async function getMessages(id: string): Promise<MessageItem[]> {
  return Promise.all([api<ApiMessage[]>(`/content/conversations/${id}/messages`), currentUserId()]).then(([rows, me]) => rows.map((m) => mapMessage(m, me)));
}
export async function sendMessage(id: string, text: string): Promise<void> {
  await api(`/content/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ body: text }) });
}
export async function getOpportunities(): Promise<OpportunityItem[]> {
  return api<ApiOpportunity[]>('/content/opportunities').then((r) => r.map(mapOpportunity));
}
export async function getNotifications(): Promise<NotificationItem[]> {
  return api<ApiNotification[]>('/content/notifications').then((r) => r.map(mapNotification));
}
export async function markNotificationRead(id: string): Promise<void> {
  await api(`/content/notifications/${id}/read`, { method: 'POST' });
}


export async function getPeople(): Promise<PublicProfileItem[]> {
  return api<PublicProfileItem[]>('/content/people');
}
export async function getPublicProfile(handle: string): Promise<PublicProfileItem | null> {
  return api<PublicProfileItem>(`/content/people/${encodeURIComponent(handle)}`);
}
export async function followUser(handle: string, follow: boolean): Promise<boolean> {
  await api(`/content/people/${encodeURIComponent(handle)}/follow`, { method: follow ? 'POST' : 'DELETE' });
  return true;
}
export async function searchAll(query: string): Promise<SearchResult> {
  return api<SearchResult>(`/content/search?q=${encodeURIComponent(query)}`);
}
export async function createConversation(userId: string): Promise<string | null> {
  const result = await api<{ id: string }>('/content/conversations', { method: 'POST', body: JSON.stringify({ participantId: userId }) });
  return result?.id ?? null;
}
export async function getResources(): Promise<{ id: string; title: string; courseCode: string; type: string; sizeLabel: string | null }[]> {
  return api<{ id: string; title: string; courseCode: string; type: string; sizeLabel: string | null }[]>('/content/resources');
}
export async function getProfile(): Promise<ProfileItem | null> {
  return api<ProfileItem | null>('/content/me');
}
export async function loginUser(email: string, password: string): Promise<boolean> {
  await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  return true;
}
export async function registerUser(displayName: string, email: string, password: string): Promise<boolean> {
  await api('/auth/register', { method: 'POST', body: JSON.stringify({ displayName, email, password }) });
  return true;
}
export async function logoutUser(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
}
