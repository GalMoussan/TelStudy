'use client';
import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
  dismissible?: boolean;
}

export function ErrorBanner({ message, dismissible = false }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      data-testid="error-banner"
      className="flex items-center justify-between border border-[var(--error)] bg-[#1a0000] px-4 py-3 text-sm text-[var(--error)]"
    >
      <span>{message}</span>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss error"
          className="ml-4 text-[var(--error)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
