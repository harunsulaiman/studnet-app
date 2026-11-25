'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
 Bell, BookOpen, Bookmark, Briefcase, Compass, Home, LogOut, Menu,
 MessageCircle, Search, Settings, ShieldCheck, Sparkles,
 UserRound, Users, X,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { getNotifications, getProfile, type ProfileItem } from '@/lib/api';





const navItems = [
 { href: '/', label: 'Feed', icon: Home },
 { href: '/academics', label: 'Academics', icon: BookOpen },
 { href: '/messages', label: 'Messages', icon: MessageCircle },
 { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
] as const;

const menuLinks = [
 { href: '/profile', label: 'Profile', icon: UserRound },
 { href: '/people', label: 'People & following', icon: Users },
 { href: '/saved', label: 'Saved', icon: Bookmark },
 { href: '/notifications', label: 'Notifications', icon: Bell },
 { href: '/settings', label: 'Settings', icon: Settings },
 { href: '/verification', label: 'Verification', icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
 const pathname = usePathname();
 const router = useRouter();
 const [profile, setProfile] = useState<ProfileItem | null>(null);
 const [query, setQuery] = useState('');
 const [menuOpen, setMenuOpen] = useState(false);
 const [searchOpen, setSearchOpen] = useState(false);
 const [unread, setUnread] = useState(0);
 const menuRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  void Promise.all([getProfile(), getNotifications()]).then(([person, notifications]) => {
    setProfile(person);
    setUnread(notifications.filter((item) => !item.read).length);
  }).catch(() => { setProfile(null); setUnread(0); });
 }, [pathname]);

 useEffect(() => {
 function closeMenu(event: MouseEvent) {
 if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
 }
 document.addEventListener('mousedown', closeMenu);
 return () => document.removeEventListener('mousedown', closeMenu);
 }, []);

 function submitSearch(event: FormEvent) {
 event.preventDefault();
 const value = query.trim();
 if (!value) return;
 const target = value.startsWith('@')
 ? `/u/${encodeURIComponent(value.slice(1))}`
 : /course|note|academic/i.test(value)
 ? `/academics?q=${encodeURIComponent(value)}`
 : /job|intern|scholar|opportunit/i.test(value)
 ? `/opportunities?q=${encodeURIComponent(value)}`
 : `/search?q=${encodeURIComponent(value)}`;
 router.push(target);
 setSearchOpen(false);
 setQuery('');
 }

 const isAuthPage = pathname === '/auth';
 if (isAuthPage) return <main className="app-shell auth-shell">{children}</main>;

 return (
 <main className="app-shell">
 <header className="topbar">
        <div className="topbar-left">
          <div className="menu-wrap" ref={menuRef}>
            <button className="icon-button menu-trigger" type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            {menuOpen && (
              <div className="menu-popover" role="menu">
                <div className="menu-profile">
                  <span className="avatar violet">{profile?.initials ?? 'SN'}</span>
                  <div><strong>{profile?.name ?? 'Student'}</strong><small>{profile?.handle ?? '@student'}</small></div>
                </div>
                {menuLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} role="menuitem" className={`menu-item ${pathname === href ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                    <Icon size={17} /> {label}
                  </Link>
                ))}
                <div className="side-divider" />
                <Link href="/help" className="menu-item" onClick={() => setMenuOpen(false)}><Compass size={17} /> Help & about</Link>
                <Link href="/auth" className="menu-item" onClick={() => setMenuOpen(false)}><LogOut size={17} /> Switch account</Link>
              </div>
            )}
          </div>
          <Link href="/" className="brand" aria-label="studNet home">
            <span className="brand-mark">sN</span>
            <span className="brand-name">stud<em>Net</em></span>
          </Link>
        </div>

        <form className={`search-pill ${searchOpen ? 'open' : ''}`} onSubmit={submitSearch} role="search">
          <Search size={16} />
          <input aria-label="Search studNet" placeholder="Search people, posts, courses, opportunities"
            value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)} />
          {query && <button type="submit" className="search-go">Go</button>}
        </form>

        <div className="topbar-actions">
          <Link href="/notifications" className="icon-button" aria-label="Notifications">
            <Bell size={19} />{unread > 0 && <span className="badge-dot" />}
          </Link>
          <Link href="/profile" className="avatar-button" aria-label="Profile"><span>{profile?.initials ?? 'SN'}</span></Link>
        </div>
      </header>


      <div className="app-body">
        <aside className="side-rail" aria-label="Navigation">
          <div className="rail-profile">
            <span className="avatar violet">{profile?.initials ?? 'SN'}</span>
            <div><strong>{profile?.name ?? 'Student'}</strong><small>{profile?.handle ?? '@student'}</small></div>
          </div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`side-link ${pathname === href ? 'active' : ''}`}><Icon size={18} /> {label}</Link>
          ))}
          <div className="side-divider" />
          {menuLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`side-link ${pathname === href ? 'active' : ''}`}><Icon size={18} /> {label}</Link>
          ))}
        </aside>

        <div className="page-content">{children}</div>

        <aside className="insight-rail" aria-label="Highlights">
          <div className="rail-card">
            <span className="rail-label"><Sparkles size={14} /> Trending</span>
            <strong>Final-year project week</strong>
            <p>240 students are sharing demos and feedback.</p>
          </div>
          <div className="rail-card">
            <span className="rail-label"><Bookmark size={14} /> Saved</span>
            <strong>Your study library</strong>
            <p>Notes and opportunities saved for later.</p>
          </div>
          <Link href="/people" className="rail-card rail-cta"><Users size={16} /> Discover people <span>→</span></Link>
          <p className="rail-foot">studNet built for students</p>
        </aside>
      </div>

      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 2} /><span>{label}</span>
            </Link>
          );
        })}
        
      </nav>
    </main>
  );
}
