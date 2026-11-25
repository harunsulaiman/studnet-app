'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import '@/app/ui.css';

export default function SettingsprivacyPage() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="page settings-detail">
      <Link href="/settings" className="back-link"><ArrowLeft size={16} /> Settings</Link>
      <h1 className="section-title">Privacy</h1>
      <div className="card card-pad settings-form">
        <label>Full name<input aria-label="Full name" placeholder="Your name" /></label>
        <label>Details<textarea aria-label="Details" rows={4} placeholder="Update your privacy preferences" /></label>
        <div className="settings-form-actions">
          <button type="button" className="btn btn-primary" onClick={() => setSaved(true)}><Save size={15} /> {saved ? 'Saved' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}
