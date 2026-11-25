'use client';

import { useEffect, useState } from 'react';
import { Bookmark, CalendarDays, ExternalLink, Sparkles } from 'lucide-react';
import '@/app/ui.css';
import { getOpportunities, type OpportunityItem } from '@/lib/api';

const filters = ['All', 'Internships', 'Scholarships', 'Grants', 'Events', 'Research', 'Jobs'];

function formatDeadline(value: string | null): string {
  if (!value) return 'Rolling';
  const days = Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
  return days === 0 ? 'Closes today' : `${days} days left`;
}

export default function OpportunitiesPage() {
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => { void getOpportunities().then(setItems); }, []);

  const visible = items.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Internships') return item.type === 'INTERNSHIP';
    if (filter === 'Scholarships') return item.type === 'SCHOLARSHIP';
    if (filter === 'Grants') return item.type === 'GRANT';
    if (filter === 'Events') return item.type === 'EVENT';
    if (filter === 'Research') return item.type === 'RESEARCH';
    return item.type === 'JOB';
  });

  return (
    <div className="page">
      <div className="page-heading">
        <h1 className="section-title">Opportunities</h1>
        <p className="feed-note">Matched to your faculty, level and interests</p>
      </div>
      <div className="pill-row">
        {filters.map((item) => (
          <button key={item} type="button" className={`pill ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>

      <div className="match-banner card card-pad">
        <div className="notif-icon"><Sparkles size={18} /></div>
        <div>
          <strong>Why these match you</strong>
          <p>Computer Science · 300 level · Lagos · Interested in engineering & AI.</p>
        </div>
      </div>

      <div className="feed-list" aria-live="polite">
        {visible.length === 0 && <div className="empty-state"><Sparkles size={22} /><p>Loading opportunities…</p></div>}
        {visible.map((item) => (
          <article key={item.id} className="card card-pad">
            <div className="opp-top">
              <div>
                <span className={`tag ${item.matchScore >= 90 ? 'hot' : 'match'}`}>{item.type.toLowerCase()}</span>
                <h3 style={{ marginTop: 9 }}>{item.title}</h3>
                <p>{item.organization} · {item.location}</p>
              </div>
              <button type="button" aria-label="Save opportunity" onClick={() => setSaved((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}>
                <Bookmark size={18} fill={saved.includes(item.id) ? 'currentColor' : 'none'} className="verified" />
              </button>
            </div>
            <p className="opp-summary">{item.summary}</p>
            <div className="opp-meta">
              <span className="tag match">{item.matchScore}% match</span>
              <span className="deadline"><CalendarDays size={11} /> {formatDeadline(item.deadline)}</span>
              <span className="tag">{item.mode}</span>
              {item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
            <div className="post-actions" style={{ marginTop: 13 }}>
              <button type="button">View details <ExternalLink size={14} /></button>
              <button type="button" onClick={() => setSaved((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}>{saved.includes(item.id) ? 'Saved' : 'Save'}</button>
              <button type="button">Share</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
