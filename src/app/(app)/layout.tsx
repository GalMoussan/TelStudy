import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { Providers } from '@/components/providers/Providers';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppNav userEmail={user.email ?? ''} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Providers>{children}</Providers>
      </main>
    </div>
  );
}
