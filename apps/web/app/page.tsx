'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BadgeCheck, Bookmark, Flame, Heart, MessageCircle, MoreHorizontal,
  Image as ImageIcon, Play, Repeat2, Send, Sparkles, TrendingUp,
} from 'lucide-react';
import '@/app/ui.css';
import { addReply, createPost, getFeed, toggleLike, toggleSave, type PostItem } from '@/lib/api';

type FeedTab = 'For You' | 'My Campus' | 'Following' | 'Forum' | 'Saved';
const feedTabs: FeedTab[] = ['For You', 'My Campus', 'Following', 'Forum', 'Saved'];
const tabCopy: Record<FeedTab, { title: string; note: string }> = {
  'For You': { title: 'For you', note: 'Creator feed' },
  'My Campus': { title: 'My campus', note: 'Verified local' },
  Following: { title: 'Following', note: 'People you trust' },
  Forum: { title: 'Forum', note: 'Threads and replies' },
  Saved: { title: 'Saved', note: 'Your library' },
};

function Composer({ tab, onPosted }: { tab: FeedTab; onPosted: () => Promise<void> }) {
 const [text, setText] = useState('');
 const [mediaKind, setMediaKind] = useState<'none' | 'photos' | 'video'>('none');
 const [mediaLabel, setMediaLabel] = useState('');
 const [busy, setBusy] = useState(false);
 const fileInput = useRef<HTMLInputElement>(null);

 const publish = async () => {
 const body = text.trim();
 if (!body || busy) return;
 setBusy(true);
 const hashtags = Array.from(body.matchAll(/#(\w+)/g), (match) => match[1]);
 await createPost({
 text: body, hashtags,
 type: tab === 'Forum' ? 'forum' : tab === 'My Campus' ? 'campus' : 'general',
 mediaKind: mediaKind === 'none' ? undefined : mediaKind,
 mediaLabel: mediaLabel || undefined,
 });
 setText(''); setMediaKind('none'); setMediaLabel(''); setBusy(false);
 await onPosted();
 };

 const pickFile = (accept: string, kind: 'photos' | 'video') => {
 const input = fileInput.current;
 if (!input) return;
 input.accept = accept;
 input.onchange = () => {
 const file = input.files?.[0];
 if (!file) return;
 setMediaKind(kind);
 setMediaLabel(`${file.name}  ${kind === 'video' ? 'Video' : 'Photo'}`);
 input.value = '';
 };
 input.click();
 };

 return (
 <div className="card composer-card">
 <div className="composer-mini">
 <div className="avatar violet">AD</div>
 <textarea aria-label="Create a post" rows={2}
 placeholder={tab === 'Forum' ? 'Ask a question or start a discussion...' : 'Share something with your campus...'}
 value={text} onChange={(event) => setText(event.target.value)} />
 </div>
 {mediaKind !== 'none' && (
 <div className="composer-media-note"><ImageIcon size={16} /> {mediaLabel || 'Media attached'}
 <button type="button" onClick={() => { setMediaKind('none'); setMediaLabel(''); }}>Remove</button></div>
 )}
 <div className="composer-tools">
 <button type="button" onClick={() => pickFile('image/*', 'photos')}><ImageIcon size={16} /> Photo</button>
 <button type="button" onClick={() => pickFile('video/*', 'video')}><Play size={16} /> Video</button>
 <button type="button" className="send" disabled={!text.trim() || busy} onClick={() => void publish()}>
 <Send size={16} /> Post
 </button>
 </div>
 <input ref={fileInput} type="file" hidden />
 </div>
 );
}
function PostCard({ post, onToggleLike, onToggleSave, onReply }: {
  post: PostItem;
  onToggleLike: (post: PostItem) => void;
  onToggleSave: (post: PostItem) => void;
  onReply: (post: PostItem, text: string) => void;
}) {
  const [liked, setLiked] = useState(Boolean(post.liked));
  const [saved, setSaved] = useState(Boolean(post.saved));
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <article className="card card-pad">
      <div className="post-head">
        <div className={`avatar ${post.color}`}>{post.avatar}</div>
        <div className="post-author">
          <div className="name-row">
            <strong>{post.name}</strong>
            {post.verified && <BadgeCheck size={14} className="verified" />}
            <span className={`type-chip type-${post.type}`}>{post.typeLabel}</span>
          </div>
          <small>{post.handle} · {post.meta} · Public</small>
          {post.ownerDetails && (
            <div className="owner-details">{post.ownerDetails.map((detail) => <span key={detail}>{detail}</span>)}</div>
          )}
        </div>
        <button className="more" type="button" aria-label="More options"><MoreHorizontal size={18} /></button>
      </div>

      <p className="post-text">{post.text}</p>

      {post.media === 'video' && (
        <div className="media-grid one">
          <div className="media video">
            <span className="play"><Play size={20} fill="currentColor" /></span>
            <span className="media-label">{post.mediaLabel ?? 'Video'}</span>
          </div>
        </div>
      )}
      {post.media === 'photos' && (
        <div className="media-grid two">
          <div className="media photo-a"><span className="media-label">Campus build log</span></div>
          <div className="media photo-b"><span className="media-label">Shipped</span></div>
        </div>
      )}

      <div className="post-meta">
        <span>{post.likes + (liked ? 1 : 0)} reactions · {post.comments + post.replies.length} comments</span>
        <span>{post.shares} shares</span>
      </div>
      <div className="post-actions">
        <button type="button" className={liked ? 'liked' : ''} onClick={() => { setLiked(!liked); onToggleLike(post); }}>
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} /> {post.likes + (liked ? 1 : 0)}
        </button>
        <button type="button" onClick={() => setReplyOpen(!replyOpen)}><MessageCircle size={15} /> {post.comments + post.replies.length}</button>
        <button type="button"><Repeat2 size={15} /> {post.shares}</button>
        <button type="button" aria-label={saved ? 'Remove from saved' : 'Save post'} className={saved ? 'liked' : ''}
          onClick={() => { setSaved(!saved); onToggleSave(post); }}>
          <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {(post.replies.length > 0 || replyOpen) && (
        <div className="forum-replies">
          {post.replies.map((reply, index) => <p key={`${reply}-${index}`}>{reply}</p>)}
          {replyOpen ? (
            <div className="reply-form">
              <input aria-label="Write a reply" placeholder="Add a reply…" value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && replyText.trim()) {
                    onReply(post, replyText.trim()); setReplyText(''); setReplyOpen(false);
                  }
                }} />
              <button type="button" className="reply-cta" onClick={() => {
                if (replyText.trim()) { onReply(post, replyText.trim()); setReplyText(''); setReplyOpen(false); }
              }}><Send size={13} /> Reply</button>
            </div>
          ) : (
            <button type="button" className="reply-cta" onClick={() => setReplyOpen(true)}><MessageCircle size={13} /> Add a reply</button>
          )}
        </div>
      )}
    </article>
  );
}

export default function FeedPage() {
  const [tab, setTab] = useState<FeedTab>('For You');
    const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setPosts(await getFeed(tab));
    setLoading(false);
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  const visiblePosts = posts;

 const handleLike = async (post: PostItem) => { await toggleLike(post.id); };
 const handleSave = async (post: PostItem) => { await toggleSave(post.id); };
 const handleReply = async (post: PostItem, text: string) => {
   await addReply(post.id, text);
   setPosts((current) => current.map((item) => item.id === post.id
     ? { ...item, replies: [...item.replies, `You: ${text}`] }
     : item));
 };

 return (
 <div className="page feed-page">
   <div className="feed-tabs" role="tablist" aria-label="Feed sections">
     {feedTabs.map((item) => (
       <button key={item} type="button" role="tab" aria-selected={tab === item}
         className={`feed-tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>
         {item}
       </button>
     ))}
   </div>
   <div className="feed-heading">
     <div>
       <h1 className="sr-only">{tabCopy[tab].title}</h1>
       <p className="section-title">{tabCopy[tab].title}</p>
       <p className="feed-note">{tabCopy[tab].note}</p>
     </div>
   </div>
   <Composer tab={tab} onPosted={load} />
   <div className="gradient-card">
     <div className="gradient-card-head">
       <span className="gradient-label"><Flame size={14} /> Happening now</span>
       <strong>Your final-year project can get seen.</strong>
     </div>
     <p>Post a 30-second demo and collect feedback from students and alumni.</p>
     <div className="pill-row">
       <span className="pill">#FinalYearProject</span>
       <span className="pill">#BuildInPublic</span>
       <span className="pill"><TrendingUp size={12} /> Rising</span>
     </div>
   </div>
   <div className="feed-list" aria-live="polite">
     {loading ? (
       <div className="empty-state"><Sparkles size={22} /><p>Loading your feed...</p></div>
     ) : visiblePosts.length > 0 ? (
       visiblePosts.map((post) => (
         <PostCard key={post.id} post={post} onToggleLike={handleLike} onToggleSave={handleSave} onReply={handleReply} />
       ))
     ) : (
       <div className="empty-state"><Sparkles size={22} /><strong>Nothing here yet</strong><p>Try another tab or be the first to post.</p></div>
     )}
   </div>
   <p className="footer-note">You are all caught up - refreshing for new posts</p>
 </div>
 );
}
