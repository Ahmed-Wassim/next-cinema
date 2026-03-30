import Link from "next/link";
import { Film } from "lucide-react";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--panel-border)] bg-[var(--bg-primary)]/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/movies" className="group flex items-center gap-2.5">
            <div className="cinema-ring flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] shadow-md shadow-[var(--theme-glow)] transition-transform duration-300 group-hover:-translate-y-0.5">
              <Film className="h-4 w-4 text-black" />
            </div>
            <span className="text-base font-bold tracking-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
              CineBook
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            <Link href="/movies" className="rounded-full px-3 py-2 transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]">
              Now Playing
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="mt-20 border-t border-[var(--panel-border)] py-6 text-center text-xs text-[var(--text-secondary)]">
        © {new Date().getFullYear()} CineBook. All rights reserved.
      </footer>
    </div>
  );
}
