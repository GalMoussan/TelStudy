'use client';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <p className="text-sm text-[var(--text)]">
        Check your email for a confirmation link.
      </p>
    );
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>
      <p className="text-center text-xs text-[var(--muted)]">
        Already have an account?{' '}
        <a href="/login" className="text-[var(--text)] underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
