'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, FileText } from 'lucide-react';
import '@/app/ui.css';
import { getFeed, type PostItem } from '@/lib/api';

export default function SavedPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  useEffect(() => { void getFeed('Saved'); }, []);
  useEffect(() => { void getFeed('Saved').then(setPosts); }, []);
  return (
    <div className="page">
      <h1 className="section-title">Saved</h1>
      <p className="muted-copy">Posts, notes and opportunities you kept for later.</p>
      {posts.map((post) => (
        <Link key={post.id} href="/" className="card card-pad saved-row">
          <Bookmark size={16} />
          <div><strong>{post.name}</strong><p>{post.text}</p></div>
        </Link>
      ))}
      {posts.length === 0 && <div className="empty-state"><FileText size={22} /><p>Nothing saved yet. Use the bookmark action on a post.</p></div>}
    </div>
  );
}
