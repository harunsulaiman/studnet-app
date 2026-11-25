'use client';

import { useEffect, useState } from 'react';
import { BellRing, CalendarDays, CheckCheck, Clock3, FileText, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import '@/app/ui.css';
import { getNotifications, markNotificationRead, type NotificationItem } from '@/lib/api';

type NotificationType = 'notice' | 'reply' | 'clock' | 'resource' | 'event';
const notificationIcons = {
  notice: BellRing, reply: MessageCircle, clock: Clock3, resource: FileText, event: CalendarDays,
} satisfies Record<NotificationType, typeof BellRing>;

const filters = ['All', 'Classes', 'Messages', 'Opportunities', 'Mentions', 'System'];

function typeFor(kind: string): NotificationType {
  if (kind === 'verification') return 'notice';
  if (kind === 'academic') return 'resource';
  if (kind === 'opportunity') return 'clock';
  if (kind === 'message') return 'reply';
  return 'event';
}

function timeAgo(value: string): string {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h`;
  return `${Math.floor(minutes / 1440)} d`;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => { void getNotifications().then(setItems); }, []);

  const visible = items.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Classes') return item.kind === 'academic';
    if (filter === 'Opportunities') return item.kind === 'opportunity';
    if (filter === 'Messages') return item.kind === 'message';
    if (filter === 'Mentions') return item.kind === 'mention';
    return item.kind === 'verification' || item.kind === 'system';
  });

  const markAll = async () => {
    await Promise.all(items.filter((item) => !item.read).map((item) => markNotificationRead(item.id)));
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  };

  const open = async (item: NotificationItem) => {
    await markNotificationRead(item.id);
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
  };

  return (
    <div className="page notification-page">
      <div className="messages-title-row">
        <h1 className="section-title">Notifications</h1>
        <button type="button" className="icon-button" aria-label="Mark all as read" onClick={() => void markAll()}><CheckCheck size={18} /></button>
      </div>
      <div className="pill-row">
        {filters.map((item) => (
          <button key={item} type="button" className={`pill ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>

      {visible.length === 0 && <div className="empty-state"><BellRing size={22} /><p>No notifications in this category.</p></div>}
      {visible.map((item) => {
        const Icon = notificationIcons[typeFor(item.kind)];
        const content = (
          <article className={`card card-pad ${item.read ? '' : 'unread-notif'}`} onClick={() => void open(item)}>
            <div className="notif-row">
              <div className="notif-icon"><Icon size={18} /></div>
              <div><strong>{item.title}</strong><p>{item.body}</p></div>
              <span className="chat-time"><Clock3 size={11} /> {timeAgo(item.createdAt)}</span>
            </div>
          </article>
        );
        return item.href ? <Link key={item.id} href={item.href} className="notif-link">{content}</Link> : <div key={item.id}>{content}</div>;
      })}
    </div>
  );
}
