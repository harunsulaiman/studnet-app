'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, MessageCircle, Search } from 'lucide-react';
import '@/app/ui.css';
import { getPeople, searchAll, type PublicProfileItem, type SearchResult } from '@/lib/api';

export default function PeoplePage() {
  const [people, setPeople] = useState<PublicProfileItem[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);

  useEffect(() => { void getPeople().then(setPeople); }, []);
  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timer = setTimeout(() => { void searchAll(query).then(setResults); }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const shown = results?.people ?? people;

  return (
    <div className="page">
      <h1 className="section-title">People</h1>
      <label className="chat-search"><Search size={16} />
        <input aria-label="Search people" placeholder="Search by name or handle" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="people-grid">
        {shown.map((person) => (
          <Link key={person.id} href={`/u/${encodeURIComponent(person.handle.replace('@', ''))}`} className="card card-pad person-card">
            <div className="person-top">
              <span className="avatar violet">{person.initials}</span>
              <div><strong>{person.name}</strong><small>{person.handle}</small></div>
              {person.verified && <BadgeCheck size={16} className="verified" />}
            </div>
            <p>{person.bio ?? 'Studying and building on campus.'}</p>
            <div className="person-meta"><span>{person.university ?? 'University'}</span><span>{person.followers} followers</span></div>
            <span className="pill person-open"><MessageCircle size={13} /> View profile</span>
          </Link>
        ))}
        {shown.length === 0 && <div className="empty-state"><Search size={22} /><p>No people found for this search.</p></div>}
      </div>
    </div>
  );
}
