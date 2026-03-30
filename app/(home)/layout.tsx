import Link from "next/link";
import { Film } from "lucide-react";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/movies" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] shadow-md shadow-[var(--theme-glow)]">
              <Film className="h-4 w-4 text-black" />
            </div>
            <span className="text-base font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              CineBook
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            <Link href="/movies" className="hover:text-[var(--text-primary)] transition-colors">
              Now Playing
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[var(--border)] py-6 text-center text-xs text-[var(--text-secondary)]">
        © {new Date().getFullYear()} CineBook. All rights reserved.
      </footer>
    </div>
  );
}
