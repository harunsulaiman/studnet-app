'use client';

import Link from 'next/link';
import { BookOpen, Compass, MessageCircle, ShieldCheck } from 'lucide-react';
import '@/app/ui.css';

const topics = [
  { icon: BookOpen, title: 'Getting started', note: 'Create a profile, follow classmates and post your first update.', href: '/' },
  { icon: ShieldCheck, title: 'Verification', note: 'Learn how institution and campus roles are confirmed.', href: '/verification' },
  { icon: MessageCircle, title: 'Messages', note: 'Start private conversations with verified students.', href: '/messages' },
  { icon: Compass, title: 'Community', note: 'Find people, forums and opportunities across your campus.', href: '/people' },
];

export default function HelpPage() {
  return (
    <div className="page">
      <h1 className="section-title">Help & about</h1>
      <p className="muted-copy">studNet is a campus network for verified students to share work, resources and opportunities.</p>
      <div className="settings-grid">
        {topics.map((topic) => (
          <Link key={topic.title} href={topic.href} className="card card-pad settings-row">
            <topic.icon size={18} />
            <div><strong>{topic.title}</strong><p>{topic.note}</p></div>
            <span>→</span>
          </Link>
        ))}
      </div>
      <div className="card card-pad"><strong>Demo account</strong><p className="muted-copy">demo@studnet.app / StudnetDemo123!</p></div>
    </div>
  );
}
