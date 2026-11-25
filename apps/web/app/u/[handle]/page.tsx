'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Bookmark, FileText, MessageCircle, Send, Trophy } from 'lucide-react';
import '@/app/ui.css';
import { createConversation, followUser, getPublicProfile, type PublicProfileItem } from '@/lib/api';

type Tab = 'Posts' | 'Replies' | 'Media' | 'About';

export default function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {

  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfileItem | null>(null);
  const [tab, setTab] = useState<Tab>('Posts');
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [handle, setHandle] = useState('');
  useEffect(() => { void params.then((value) => setHandle(decodeURIComponent(value.handle))); }, [params]);


  useEffect(() => {
    if (!handle) return;
    void getPublicProfile(handle).then((item) => {

      setProfile(item);
      setFollowing(Boolean(item?.followingYou));
    });
  }, [handle]);

  const toggleFollow = async () => {
    if (!profile || busy) return;
    setBusy(true);
    const ok = await followUser(handle, !following);
    if (ok) setFollowing(!following);
    setBusy(false);
  };

  const message = async () => {
    if (!profile) return;
    const id = await createConversation(profile.id);
    if (id) router.push(`/messages?c=${id}`);
  };

  return (
    <div className="page profile-page">
      <Link href="/people" className="back-link"><ArrowLeft size={16} /> People</Link>
      <section className="profile-hero">
        <div className="profile-hero-top">
          <span className="avatar xl violet">{profile?.initials ?? 'SN'}</span>
          <div className="profile-hero-main">
            <h1>{profile?.name ?? handle}</h1>
            <p className="profile-handle">{profile?.handle ?? `@${handle}`}</p>
            <p className="profile-bio">{profile?.bio ?? 'This student has not added a bio yet.'}</p>
          </div>
          {profile?.verified && <span className="verified-badge"><BadgeCheck size={16} /> Verified</span>}
        </div>
        <div className="profile-tags">
          {profile?.university && <span>{profile.university}</span>}
          {profile?.department && <span>{profile.department}</span>}
          {profile?.programme && <span>{profile.programme}</span>}
          {profile?.level && <span>{profile.level} Level</span>}
        </div>
        <div className="profile-stat-row">
          <span><strong>{profile?.posts ?? 0}</strong> Posts</span>
          <span><strong>{profile?.followers ?? 0}</strong> Followers</span>
          <span><strong>{profile?.following ?? 0}</strong> Following</span>
          <span><strong>{profile?.resources ?? 0}</strong> Resources</span>
        </div>
        <div className="profile-actions">
          <button type="button" className={`btn ${following ? 'btn-outline' : 'btn-primary'}`} disabled={busy} onClick={() => void toggleFollow()}>
            {following ? 'Following' : 'Follow'}
          </button>
          {profile?.canMessage && <button type="button" className="btn btn-outline" onClick={() => void message()}><MessageCircle size={15} /> Message</button>}
        </div>
      </section>
      <div className="feed-tabs">
        {(['Posts', 'Replies', 'Media', 'About'] as Tab[]).map((item) => (
          <button key={item} type="button" className={`feed-tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      <div className="card card-pad">
        <div className="section-title">{tab}</div>
        <p className="muted-copy">
          {tab === 'About' ? (profile?.bio ?? 'No additional details yet.') :
            tab === 'Media' ? 'Photo and video posts from this student will appear here.' :
            tab === 'Replies' ? 'Public replies and forum answers will appear here.' :
            'Public posts from this student will appear here.'}
        </p>
      </div>
      <div className="stat-grid">
        <Link href="/saved" className="card stat-card"><Bookmark size={18} /><strong>{profile?.saved ?? 0}</strong><span>Saved</span></Link>
        <div className="card stat-card"><FileText size={18} /><strong>{profile?.resources ?? 0}</strong><span>Resources</span></div>
        <div className="card stat-card"><Trophy size={18} /><strong>{profile?.likes ?? 0}</strong><span>Helpful votes</span></div>
        <div className="card stat-card"><Send size={18} /><strong>{profile?.answers ?? 0}</strong><span>Answers</span></div>
      </div>
    </div>
  );
}
