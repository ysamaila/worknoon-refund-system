import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Worknoon Refund System',
  description: 'AI-assisted, deterministic e-commerce refund management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                W
              </span>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight">Worknoon</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Refund Automation
                </span>
              </div>
            </div>

            <nav className="flex space-x-1 sm:space-x-2">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
              >
                Customer Portal
              </Link>
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
              >
                Admin Console
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <p>
            Worknoon Assessment © 2026. Deterministic Policy Engine with Scoped AI Classification.
          </p>
        </footer>
      </body>
    </html>
  );
}
