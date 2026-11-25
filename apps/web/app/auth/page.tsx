'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/app/ui.css';
import { loginUser, registerUser } from '@/lib/api';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('demo@studnet.app');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const ok = mode === 'login'
      ? await loginUser(email, password)
      : await registerUser(displayName, email, password);
    setBusy(false);
    if (ok) router.push('/profile');
    else setError('Unable to sign in. Check your details and try again.');
  }

  return (
    <div className="page auth-page">
      <div className="card card-pad auth-card">
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted-text">Sign in to post, save, message and personalise your feed.</p>
        <div className="pill-row">
          <button className={`pill ${mode === 'login' ? 'active' : ''}`} type="button" onClick={() => setMode('login')}>Sign in</button>
          <button className={`pill ${mode === 'register' ? 'active' : ''}`} type="button" onClick={() => setMode('register')}>Register</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <input required placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          )}
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="password" placeholder="Password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="auth-error">{error}</p>}
          <button className="primary-button" disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="muted-text">Demo: demo@studnet.app / StudnetDemo123!</p>
        <Link className="muted-text" href="/">Continue browsing →</Link>
      </div>
    </div>
  );
}
