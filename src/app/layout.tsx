import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TelStudy',
  description: 'Minimalist quiz tool for precision learning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[var(--background)] text-[var(--text)] antialiased">
        {children}
      </body>
    </html>
  );
}
