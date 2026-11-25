'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, FileText, Mic, MoreVertical, Paperclip,
  Phone, Pin, Search, Send, Smile, Video,
} from 'lucide-react';
import '@/app/ui.css';
import {
  getConversations, getMessages, sendMessage,
  type ConversationItem, type MessageItem,
} from '@/lib/api';

type Filter = 'All' | 'Unread' | 'Groups';
const filters: Filter[] = ['All', 'Unread', 'Groups'];

export default function MessagesPage() {
  const [filter, setFilter] = useState<Filter>('All');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);

  useEffect(() => {
    void getConversations().then((items) => {
      setConversations(items);
      
    });
  }, []);

  useEffect(() => {
    if (activeId) void getMessages(activeId).then(setMessages);
  }, [activeId]);

  const visible = conversations
    .filter((item) => filter === 'All' || (filter === 'Unread' ? item.unread > 0 : item.group))
    .filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const active = conversations.find((item) => item.id === activeId);

  async function selectConversation(id: string) {
    setActiveId(id);
    setMessages(await getMessages(id));
    setConversations((current) => current.map((item) => item.id === id ? { ...item, unread: 0 } : item));
  }

  const doSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((current) => [...current, { id: `local-${Date.now()}`, who: 'me', text, time }]);
    setDraft('');
    await sendMessage(activeId, text);
  }, [draft, activeId]);

  return (
    <div className="page page-messages">
      <div className="messages-title-row">
        <h1 className="section-title">Messages</h1>
        <button className="icon-button" type="button" aria-label="More options"><MoreVertical size={18} /></button>
      </div>
      <div className="pill-row">
        {filters.map((item) => (
          <button key={item} type="button" className={`pill ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>
      <div className="chat-shell">
        <aside className={`chat-list ${active ? 'chat-list-compact' : ''}`}>
          <label className="chat-search">
            <Search size={15} />
            <input aria-label="Search conversations" placeholder="Search messages" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="conversation-list">
            {visible.length ? visible.map((item) => (
              <button key={item.id} type="button" className={`chat-row ${activeId === item.id ? 'active' : ''}`} onClick={() => void selectConversation(item.id)}>
                <span className={`avatar ${item.color}`}>{item.initials}</span>
                <span className="chat-main">
                  <span className="chat-name"><strong>{item.name}</strong>{item.pinned && <Pin size={12} className="pin-mark" />}</span>
                  <small>{item.message}</small>
                </span>
                <span className="chat-side">
                  <span className="chat-time">{item.time}</span>
                  {item.unread > 0 && <span className="unread">{item.unread}</span>}
                </span>
              </button>
            )) : <p className="empty-note">No conversations match this search.</p>}
          </div>
        </aside>
        {active && (
          <section className="chat-window" aria-label={`Chat with ${active.name}`}>
            <header className="chat-header">
              <button className="icon-button back-button" type="button" aria-label="Back to conversations" onClick={() => { setActiveId(''); setMessages([]); }}><ArrowLeft size={18} /></button>
              <span className={`avatar ${active.color}`}>{active.initials}</span>
              <div className="chat-header-main">
                <strong>{active.name}</strong>
                <small><BadgeCheck size={12} className="verified" /> Verified · {active.group ? 'Group chat' : 'Active now'}</small>
              </div>
              <button className="icon-button" type="button" aria-label="Start voice call"><Phone size={17} /></button>
              <button className="icon-button" type="button" aria-label="Start video call"><Video size={17} /></button>
            </header>
            <div className="chat-stream">
              <span className="day-chip">Today</span>
              {messages.map((message) => (
                <div key={message.id} className={`bubble ${message.who}`}>
                  <p>{message.text}</p><small>{message.time}</small>
                </div>
              ))}
              <div className="shared-resource">
                <FileText size={18} />
                <span><strong>Week 6 checklist.pdf</strong><small>Shared in this conversation · 2 pages</small></span>
                <button type="button">Open</button>
              </div>
            </div>
            <div className="composer message-composer">
              <button className="icon-button" type="button" aria-label="Attach a file"><Paperclip size={17} /></button>
              <input aria-label="Message" placeholder="Write a message…" value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void doSend(); }} />
              <button className="icon-button" type="button" aria-label="Add emoji"><Smile size={17} /></button>
              <button className="icon-button" type="button" aria-label="Record voice note"><Mic size={17} /></button>
              <button className="send" type="button" aria-label="Send message" onClick={() => void doSend()}><Send size={16} /></button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

