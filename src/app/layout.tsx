import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { RestaurantProvider } from '../context/RestaurantContext';
import { AppLayout } from '../components/AppLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SR Hotel – Complete Restaurant & Billing Management System',
  description:
    'Full-featured restaurant & supermarket billing management system for SR Hotel with cashier counter, waiter mobile POS, kitchen KDS, inventory, and admin menu management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F1F5F9] text-[#0F172A] font-sans">
        <RestaurantProvider>
          <AppLayout>{children}</AppLayout>
        </RestaurantProvider>
      </body>
    </html>
  );
}
