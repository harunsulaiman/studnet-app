'use client';

import Link from 'next/link';
import { ShieldCheck, BadgeCheck, FileText } from 'lucide-react';
import '@/app/ui.css';

const settingsPages = [
  { href: '/settings/profile', label: 'Profile details', note: 'Name, bio, academic identity', icon: FileText },
  { href: '/settings/account', label: 'Account', note: 'Email, password, sessions', icon: ShieldCheck },
  { href: '/settings/privacy', label: 'Privacy', note: 'Visibility and controls', icon: ShieldCheck },
  { href: '/settings/notifications', label: 'Notifications', note: 'What you hear about', icon: BadgeCheck },
  { href: '/settings/verification', label: 'Verification', note: 'Institution and campus status', icon: BadgeCheck },
];

export default function SettingsPage() {
  return (
    <div className="page">
      <h1 className="section-title">Settings</h1>
      <div className="settings-grid">
        {settingsPages.map((item) => (
          <Link key={item.href} href={item.href} className="card card-pad settings-row">
            <item.icon size={18} />
            <div><strong>{item.label}</strong><p>{item.note}</p></div>
            <span>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
