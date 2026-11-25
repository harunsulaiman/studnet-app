'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, CalendarDays, FileText, HelpCircle, Users, BadgeCheck, Search } from 'lucide-react';
import '@/app/ui.css';
import { getResources } from '@/lib/api';

const courses = [
  { code: 'CSC 301', title: 'Software Engineering', meta: '2 new notes · 1 open question', icon: 'SE' },
  { code: 'CSC 303', title: 'Database Systems', meta: 'Quiz moved to Friday', icon: 'DB' },
  { code: 'MTH 301', title: 'Applied Statistics', meta: 'Study group: tomorrow, 6 PM', icon: 'AS' },
];

export default function AcademicsPage() {
  const [resources, setResources] = useState<{ id: string; title: string; courseCode: string; type: string; sizeLabel: string | null }[]>([]);
  const [query, setQuery] = useState('');
  useEffect(() => { void getResources().then(setResources); }, []);

  const visibleResources = resources.filter((resource) =>
    `${resource.title} ${resource.courseCode}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="page">
      <div className="page-heading">
        <h1 className="section-title">Academics</h1>
        <p className="feed-note">Courses, verified notes and study activity in one place</p>
      </div>

      <div className="stat-grid">
        <div className="card stat-card"><strong>3</strong><span>Active courses</span></div>
        <div className="card stat-card"><strong>{resources.length || 12}</strong><span>Shared resources</span></div>
        <div className="card stat-card"><strong>7</strong><span>Open questions</span></div>
        <div className="card stat-card"><strong>4</strong><span>Study circles</span></div>
      </div>

      <div className="section-title">My courses</div>
      <div className="course-list">
        {courses.map((course) => (
          <article className="card card-pad course-row" key={course.code}>
            <div className="avatar violet">{course.icon}</div>
            <div>
              <strong>{course.code} · {course.title}</strong>
              <p>{course.meta}</p>
            </div>
            <Link href="/messages" className="pill">Open course</Link>
          </article>
        ))}
      </div>

      <div className="section-title">Study activity</div>
      <div className="card card-pad">
        <div className="notif-row"><div className="notif-icon"><BellRing size={18} /></div><div><strong>Quiz moved to Friday</strong><p>CSC 303 · Database Systems · 11:30 AM</p></div></div>
      </div>
      <div className="card card-pad">
        <div className="notif-row"><div className="notif-icon"><Users size={18} /></div><div><strong>Study group: tomorrow, 6 PM</strong><p>MTH 301 · Applied Statistics · Library Level 3</p></div></div>
      </div>
      <div className="card card-pad">
        <div className="notif-row"><div className="notif-icon"><HelpCircle size={18} /></div><div><strong>2 classmates need help</strong><p>MTH 301 tutorial question 4 · Answer to earn trust</p></div></div>
      </div>

      <div className="section-title">Resources</div>
      <label className="chat-search">
        <Search size={15} />
        <input aria-label="Search resources" placeholder="Search course resources" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {visibleResources.length ? visibleResources.map((resource) => (
        <div className="card card-pad" key={resource.id}>
          <div className="notif-row"><div className="notif-icon"><FileText size={18} /></div><div><strong>{resource.title}</strong><p>{resource.courseCode} · {resource.type} · {resource.sizeLabel ?? 'StudNet resource'}</p></div></div>
        </div>
      )) : <div className="empty-state"><FileText size={22} /><p>No resources match this search.</p></div>}

      <div className="section-title">Academic tools</div>
      <div className="pill-row">
        <span className="pill"><CalendarDays size={12} /> Timetable</span>
        <span className="pill"><FileText size={12} /> Notes</span>
        <span className="pill"><BadgeCheck size={12} /> Verification</span>
        <span className="pill"><Users size={12} /> Study groups</span>
      </div>
    </div>
  );
}
