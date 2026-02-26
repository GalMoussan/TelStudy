import Link from 'next/link';
import { signOut } from '@/app/actions/auth';

interface AppNavProps {
  userEmail: string;
}

export function AppNav({ userEmail }: AppNavProps) {
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        {/* Brand + Nav links */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-mono text-sm font-semibold tracking-tight text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            TelStudy
          </Link>
          <Link
            href="/history"
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            History
          </Link>
        </div>

        {/* User + Sign out */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-[var(--muted)]">{userEmail}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs text-[var(--muted)] underline hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
