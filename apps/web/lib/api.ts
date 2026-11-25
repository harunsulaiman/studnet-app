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

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? '';

async function api<T>(path: string, init?: RequestInit, retry = true): Promise<T | null> {
  try {
    const response = await fetch(`${API_ORIGIN}/api/v1${path}`, {
      credentials: 'include', ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(3000),
    });
    if (response.status === 401 && retry && !path.startsWith('/auth/')) {
      const refreshed = await fetch(`${API_ORIGIN}/api/v1/auth/refresh`, {
        method: 'POST', credentials: 'include', signal: AbortSignal.timeout(3000),
      });
      if (refreshed.ok) return api<T>(path, init, false);
    }
 const json = (await response.json()) as unknown;
 if (json && typeof json === 'object' && 'data' in json) {
 const wrapped = json as { data: T | null };
 return wrapped.data;
 }
 if (response.ok && path.startsWith('/auth/')) return json as T;
 if (!response.ok) return null;
 return json as T;
  } catch {
    return null;
  }
}
const now = Date.now();

const fallbackPosts: PostItem[] = [
  {
    id: 'p1', name: 'Tobi Zaynab', avatar: 'TZ', color: 'pink', verified: true,
    type: 'media', typeLabel: 'Video', handle: '@tobihcreates', meta: '14 min',
 media: 'video',

    text: 'Made a 30-second breakdown of how I turned one lecture slide into a study thread that got 900 saves. The carousel is wild.',
 mediaLabel: '0:32  Study thread breakdown',
    hashtags: ['FinalYearProject', 'BuildInPublic'], likes: 248, comments: 36, shares: 12,
    liked: false, saved: false, replies: [],
  },
  {
    id: 'p2', name: 'Ada Okafor', avatar: 'AO', color: 'purple', verified: true,
    type: 'academic', typeLabel: 'Resource', handle: '@ada.builds', meta: '2 hr',
    text: 'CSC 301 indexing cheat sheet is live. B-trees, hash indexes, and when not to use each one.',
    media: null, hashtags: ['CSC301', 'StudyNotes'], likes: 189, comments: 22, shares: 9,
    liked: false, saved: true, replies: [],
  },
  {
    id: 'p3', name: 'Chinedu Bala', avatar: 'CB', color: 'orange', verified: false,
    type: 'forum', typeLabel: 'Forum', handle: '@chinedu.ng', meta: '5 hr',
    text: 'How are you approaching the final-year project proposal? Sharing my rubric breakdown.',
    media: null, hashtags: ['FinalYearProject', 'Question'], likes: 74, comments: 18, shares: 3,
    liked: false, saved: false, replies: ['Ada Okafor: Start with the problem statement, then map each rubric line to evidence.'],
  },
  {
    id: 'p4', name: 'Ngozi Eze', avatar: 'NE', color: 'pink', verified: true,
    type: 'campus', typeLabel: 'Campus', handle: '@ngozireads', meta: '8 hr',
    text: 'Library has extended hours during project week. Level 4 is quiet after 6pm.',
    media: null, hashtags: ['CampusUpdate'], likes: 96, comments: 11, shares: 5,
    liked: false, saved: false, replies: [],
  },
];

const fallbackConversations: ConversationItem[] = [
  { id: 'c1', name: 'Final year project group', group: true, pinned: true, initials: 'FG', color: 'pink', message: 'Ada: Week 6 checklist is in the files.', time: '12:14', unread: 3 },
  { id: 'c2', name: 'Tobi Zaynab', group: false, pinned: false, initials: 'TZ', color: 'purple', message: 'Sending my notes tonight.', time: '11:48', unread: 1 },
  { id: 'c3', name: 'Study squad', group: true, pinned: false, initials: 'SS', color: 'orange', message: 'See you at the library.', time: 'Yesterday', unread: 0 },
];

const fallbackMessages: Record<string, MessageItem[]> = {
  c1: [
    { id: 'm1', who: 'them', text: 'I shared the Week 6 checklist in the group files. Please review before Thursday.', time: '11:02' },
    { id: 'm2', who: 'me', text: 'Got it, checking it now.', time: '11:06' },
    { id: 'm3', who: 'them', text: 'The rubric section changed slightly, pay attention to page 4.', time: '11:09' },
  ],
  c2: [{ id: 'm4', who: 'them', text: 'Sending my notes tonight.', time: '11:48' }],
  c3: [{ id: 'm5', who: 'me', text: 'See you at the library.', time: 'Yesterday' }],
};

const fallbackOpportunities: OpportunityItem[] = [
  { id: 'o1', title: 'Product Design Intern', organization: 'Flutterwave', type: 'INTERNSHIP', location: 'Remote  Nigeria', mode: 'Remote', deadline: new Date(now + 12 * 86_400_000).toISOString(), tags: ['Design', 'Paid', '3 months'], matchScore: 96, summary: 'Work with the design systems team on student-facing experiences.' },
  { id: 'o2', title: 'National Merit Scholarship', organization: 'NNPC Foundation', type: 'SCHOLARSHIP', location: 'Nationwide', mode: 'Hybrid', deadline: new Date(now + 25 * 86_400_000).toISOString(), tags: ['Scholarship', 'Undergrad'], matchScore: 91, summary: 'Full tuition support for students with demonstrated leadership.' },
  { id: 'o3', title: 'Research Assistant  AI Systems', organization: 'UNILAG', type: 'RESEARCH', location: 'Lagos', mode: 'On-site', deadline: new Date(now + 9 * 86_400_000).toISOString(), tags: ['Research', 'AI', 'Stipend'], matchScore: 88, summary: 'Assist on applied NLP research with publication opportunities.' },
  { id: 'o4', title: 'Graduate Product Track', organization: 'Paystack', type: 'JOB', location: 'Lagos / Remote', mode: 'Hybrid', deadline: new Date(now + 40 * 86_400_000).toISOString(), tags: ['Graduate', 'Product', 'Full-time'], matchScore: 84, summary: 'Structured graduate programme for exceptional builder minds.' },
];

const fallbackNotifications: NotificationItem[] = [
  { id: 'n1', kind: 'verification', title: 'You are verified', body: 'Your institution email has been confirmed.', href: '/profile', read: false, createdAt: new Date(now - 900_000).toISOString() },
  { id: 'n2', kind: 'academic', title: 'New course resource', body: 'CSC 301 study guide was added by Ada.', href: '/academics', read: false, createdAt: new Date(now - 3_600_000).toISOString() },
  { id: 'n3', kind: 'opportunity', title: 'New match for you', body: 'Product Design Intern is 96% match.', href: '/opportunities', read: false, createdAt: new Date(now - 8_600_000).toISOString() },
];



export async function getFeed(tab?: string): Promise<PostItem[]> {
  return (await api<PostItem[]>(`/content/feed?tab=${encodeURIComponent(tab ?? 'For You')}`)) ?? fallbackPosts;
}
export async function createPost(input: { text: string; type?: string; hashtags?: string[]; mediaKind?: string; mediaLabel?: string }): Promise<boolean> {
  return (await api<{ id: string }>('/content/posts', { method: 'POST', body: JSON.stringify(input) })) !== null;
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
  return (await api<ConversationItem[]>('/content/conversations')) ?? fallbackConversations;
}
export async function getMessages(id: string): Promise<MessageItem[]> {
  return (await api<MessageItem[]>(`/content/conversations/${id}/messages`)) ?? fallbackMessages[id] ?? [];
}
export async function sendMessage(id: string, text: string): Promise<void> {
  await api(`/content/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
}
export async function getOpportunities(): Promise<OpportunityItem[]> {
  return (await api<OpportunityItem[]>('/content/opportunities')) ?? fallbackOpportunities;
}
export async function getNotifications(): Promise<NotificationItem[]> {
  return (await api<NotificationItem[]>('/content/notifications')) ?? fallbackNotifications;
}
export async function markNotificationRead(id: string): Promise<void> {
  await api(`/content/notifications/${id}/read`, { method: 'POST' });
}

export interface PublicProfileItem extends ProfileItem {
  followers: number; following: number; mutuals: string[];
  canMessage: boolean; followingYou: boolean; joined: string;
}
export interface SearchResult {
  people: PublicProfileItem[]; posts: PostItem[];
  opportunities: OpportunityItem[]; resources: { id: string; title: string; courseCode: string; type: string; sizeLabel: string | null }[];
}

export async function getPeople(): Promise<PublicProfileItem[]> {
  return (await api<PublicProfileItem[]>('/content/people')) ?? [];
}
export async function getPublicProfile(handle: string): Promise<PublicProfileItem | null> {
  return api<PublicProfileItem>(`/content/people/${encodeURIComponent(handle)}`);
}
export async function followUser(handle: string, follow: boolean): Promise<boolean> {
  return (await api(`/content/people/${encodeURIComponent(handle)}/follow`, {
    method: follow ? 'POST' : 'DELETE',
  })) !== null;
}
export async function searchAll(query: string): Promise<SearchResult> {
  const empty: SearchResult = { people: [], posts: [], opportunities: [], resources: [] };
  return (await api<SearchResult>(`/content/search?q=${encodeURIComponent(query)}`)) ?? empty;
}
export async function createConversation(userId: string): Promise<string | null> {
  const result = await api<{ id: string }>('/content/conversations', {
    method: 'POST', body: JSON.stringify({ userId }),
  });
  return result?.id ?? null;
}

export async function getResources(): Promise<{ id: string; title: string; courseCode: string; type: string; sizeLabel: string | null }[]> {
  const items = await api<{ id: string; title: string; courseCode: string; type: string; sizeLabel: string | null }[]>('/content/resources');
  return items ?? [
    { id: 'r1', title: 'Database indexing explained', courseCode: 'CSC 303', type: 'PDF', sizeLabel: '4 pages' },
    { id: 'r2', title: 'Software engineering rubric', courseCode: 'CSC 301', type: 'PDF', sizeLabel: '2 pages' },
  ];
}
const guestProfile: ProfileItem = {
 id: 'guest', name: 'Student', email: 'guest@studnet.app', handle: '@student', initials: 'SN',
 verified: false, verification: 'UNVERIFIED', university: null, department: null, programme: null,
 level: null, bio: null, avatarUrl: null, posts: 0, likes: 0, answers: 0, resources: 0, saved: 0,
};

export async function getProfile(): Promise<ProfileItem | null> {
 return (await api<ProfileItem>('/content/me')) ?? guestProfile;
}
export async function loginUser(email: string, password: string): Promise<boolean> {
  return (await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })) !== null;
}
export async function registerUser(displayName: string, email: string, password: string): Promise<boolean> {
  return (await api('/auth/register', { method: 'POST', body: JSON.stringify({ displayName, email, password }) })) !== null;
}
export async function logoutUser(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
}
