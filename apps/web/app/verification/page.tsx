'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, FileText, ShieldCheck } from 'lucide-react';
import '@/app/ui.css';
import { getProfile, type ProfileItem } from '@/lib/api';

const steps = [
  { title: 'Email confirmed', note: 'Your account email is connected to studNet.', icon: BadgeCheck, done: true },
  { title: 'Institution email', note: 'Use a school email to unlock campus verification.', icon: ShieldCheck, done: false },
  { title: 'Student ID review', note: 'Upload a clear photo of your student ID for manual review.', icon: FileText, done: false },
];

export default function VerificationPage() {
  const [profile, setProfile] = useState<ProfileItem | null>(null);
  useEffect(() => { void getProfile().then(setProfile); }, []);
  return (
    <div className="page">
      <h1 className="section-title">Verification</h1>
      <p className="muted-copy">Build trust by verifying your institution and campus role.</p>
      <div className="verification-banner">
        <BadgeCheck size={22} />
        <div><strong>{profile?.verification ?? 'UNVERIFIED'}</strong><p>{profile?.university ?? 'Add your institution to begin verification.'}</p></div>
      </div>
      <div className="card card-pad">
        {steps.map((step, index) => (
          <div key={step.title} className={`verify-step ${step.done ? 'done' : ''}`}>
            <step.icon size={18} />
            <div><strong>{index + 1}. {step.title}</strong><p>{step.note}</p></div>
            <span>{step.done ? 'Complete' : 'Pending'}</span>
          </div>
        ))}
      </div>
      <Link href="/settings/verification" className="btn btn-primary">Manage verification</Link>
    </div>
  );
}
