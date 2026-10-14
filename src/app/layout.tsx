import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { RestaurantProvider } from '../context/RestaurantContext';
import { Navbar } from '../components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Naga Hotel – Complete Restaurant Management System',
  description:
    'Full-featured restaurant management system for Naga Hotel with cashier counter, waiter mobile POS, kitchen KDS, and admin menu management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        <RestaurantProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </RestaurantProvider>
      </body>
    </html>
  );
}
