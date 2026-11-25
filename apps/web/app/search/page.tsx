'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import '@/app/ui.css';
import { getFeed, searchAll, type PostItem, type SearchResult } from '@/lib/api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);

  const run = async () => {
    if (!query.trim()) return;
    setResult(await searchAll(query));
    setPosts(await getFeed());
  };

  const matchedPosts = posts.filter((post) => {
    const q = query.toLowerCase();
    return post.text.toLowerCase().includes(q) || post.hashtags.some((tag) => tag.toLowerCase().includes(q));
  });

  return (
    <div className="page">
      <h1 className="section-title">Search</h1>
      <form className="chat-search" onSubmit={(event) => { event.preventDefault(); void run(); }}>
        <Search size={16} />
        <input aria-label="Search studNet" placeholder="People, posts, courses, opportunities" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="submit" className="btn btn-primary btn-sm">Search</button>
      </form>
      {result && (
        <div className="search-summary">Found {result.people.length} people, {matchedPosts.length} posts, {result.opportunities.length} opportunities and {result.resources.length} resources.</div>
      )}
      {matchedPosts.map((post) => <article key={post.id} className="card card-pad"><strong>{post.name}</strong><p>{post.text}</p></article>)}
      {result?.resources.map((item) => <article key={item.id} className="card card-pad"><strong>{item.title}</strong><p>{item.courseCode} · {item.type}</p></article>)}
    </div>
  );
}
