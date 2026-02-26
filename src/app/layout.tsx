import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TelStudy',
  description: 'Minimalist quiz tool for precision learning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
