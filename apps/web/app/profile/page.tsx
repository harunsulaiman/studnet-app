'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Bookmark, FileText, LogOut, MessageCircle, Settings, ShieldCheck, Trophy, UserRound } from 'lucide-react';
import '@/app/ui.css';
import { getProfile, logoutUser, type ProfileItem } from '@/lib/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileItem | null>(null);
 const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { setProfile(await getProfile()); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  if (!profile) return <div className="page">{loading ? "Loading" : "No profile available."}</div>;
 const data = profile;
  const stats = [
    { icon: <FileText size={18} />, label: 'Posts shared', value: data.posts },
    { icon: <MessageCircle size={18} />, label: 'Answers', value: data.answers },
    { icon: <Trophy size={18} />, label: 'Helpful votes', value: data.likes },
    { icon: <Bookmark size={18} />, label: 'Saved', value: data.saved },
  ];

  return (
    <div className="page profile-page">
      <div className="card card-pad passport">
        <div className="passport-top">
          <div className="avatar xl violet" >{data.initials}</div>
          {data.verified && <BadgeCheck size={24} />}
        </div>
        <h2>{data.name}</h2>
        <p>{data.handle} · {data.email}</p>
        {data.bio && <p>{data.bio}</p>}
        <div className="passport-tags">
          {data.university && <span>{data.university}</span>}
          {data.department && <span>{data.department}</span>}
          {data.level && <span>{data.level} Level</span>}
          {data.programme && <span>{data.programme}</span>}
        </div>
        <div className="pill-row">
          <Link className="pill" href="/settings/profile">Edit profile</Link>
          <button className="pill" type="button" onClick={async () => { await logoutUser(); await load(); }}><LogOut size={14} /> Sign out</button>
        </div>
      </div>

      <div className="section-title">Contribution</div>
      <div className="stat-grid">
        {stats.map((item) => (
          <div key={item.label} className="card stat-card">
            {item.icon}<strong>{item.value}</strong><span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="section-title">Your space</div>
      <div className="card card-pad">
        <div className="notif-row"><div className="notif-icon"><UserRound size={18} /></div><div><strong>About & academic identity</strong><p>{data.university ?? 'Add your university'} · {data.department ?? 'Add your department'}</p></div></div>
      </div>
      <div className="card card-pad">
        <div className="notif-row"><div className="notif-icon"><FileText size={18} /></div><div><strong>Posts & resources</strong><p>{data.posts} posts · {data.resources} resources shared.</p></div></div>
      </div>
      <div className="card card-pad">
        <div className="notif-row"><div className="notif-icon"><Bookmark size={18} /></div><div><strong>Saved</strong><p>{data.saved} saved items in your library.</p></div><Link className="pill" href="/saved">Open</Link></div>
      </div>
      <div className="card card-pad">
        <div className="notif-row"><div className="notif-icon"><ShieldCheck size={18} /></div><div><strong>Verification & privacy</strong><p>{data.verification.replaceAll('_', ' ').toLowerCase()}</p></div></div>
      </div>
      <div className="card card-pad">
        <div className="notif-row"><div className="notif-icon"><MessageCircle size={18} /></div><div><strong>Messages</strong><p>Your course groups and study chats.</p></div><Link className="pill" href="/messages">Open</Link></div>
      </div>
      <div className="card card-pad">
        <div className="notif-row"><div className="notif-icon"><Settings size={18} /></div><div><strong>Settings</strong><p>Account and notification preferences.</p></div></div>
      </div>
    </div>
  );
}
