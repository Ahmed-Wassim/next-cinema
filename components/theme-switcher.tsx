"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronUp, MonitorPlay, Palette } from "lucide-react";

type ThemeKey = "cinematic" | "luxury" | "neon";

type Theme = {
  name: string;
  key: ThemeKey;
  vars: Record<string, string>;
  glow: string;
};

const themes: Theme[] = [
  {
    name: "Classic Cinematic",
    key: "cinematic",
    vars: {
      "--bg-primary": "#0B0B0F",
      "--bg-secondary": "#14141A",
      "--accent": "#E50914",
      "--accent-hover": "#FF2A2A",
      "--text-primary": "#FFFFFF",
      "--text-secondary": "#B3B3B3",
    },
    glow: "rgba(229, 9, 20, 0.35)",
  },
  {
    name: "Luxury Gold",
    key: "luxury",
    vars: {
      "--bg-primary": "#0A0A0A",
      "--bg-secondary": "#121212",
      "--accent": "#D4AF37",
      "--accent-soft": "#F5E6A9",
      "--text-primary": "#FFFFFF",
      "--text-secondary": "#CFCFCF",
    },
    glow: "rgba(212, 175, 55, 0.35)",
  },
  {
    name: "Neon",
    key: "neon",
    vars: {
      "--bg-primary": "#07070A",
      "--bg-secondary": "#111827",
      "--accent": "#00E5FF",
      "--accent-secondary": "#7C3AED",
      "--text-primary": "#F9FAFB",
      "--text-secondary": "#9CA3AF",
    },
    glow: "rgba(0, 229, 255, 0.30)",
  },
];

const STORAGE_KEY = "cinemaTheme";
const THEME_CHANGE_EVENT = "cinema-theme-change";

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.style.setProperty("--border", theme.vars["--accent"] ?? "#333");
  root.style.setProperty("--background", theme.vars["--bg-primary"] ?? "#07070A");
  root.style.setProperty("--foreground", theme.vars["--text-primary"] ?? "#f8fafc");
  root.style.setProperty("--color-background", theme.vars["--bg-primary"] ?? "#07070A");
  root.style.setProperty("--color-foreground", theme.vars["--text-primary"] ?? "#f8fafc");

  root.style.setProperty("--theme-glow", theme.glow);
  root.dataset.theme = theme.key;
}

function getThemeByKey(key?: ThemeKey | string | null): Theme | undefined {
  return themes.find((theme) => theme.key === key);
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function getThemeKeySnapshot() {
  return getThemeByKey(window.localStorage.getItem(STORAGE_KEY))?.key ?? themes[0].key;
}

function getThemeKeyServerSnapshot() {
  return themes[0].key;
}

export default function ThemeSwitcher() {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeThemeKey = useSyncExternalStore(
    subscribe,
    getThemeKeySnapshot,
    getThemeKeyServerSnapshot
  );
  const activeTheme = getThemeByKey(activeThemeKey) ?? themes[0];

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  const handleSelect = (theme: Theme) => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme.key);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-3 sm:bottom-6 sm:px-6">
      <div className="pointer-events-auto mx-auto max-w-5xl rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel-bg)] px-4 py-4 shadow-[0_22px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
              <span className="absolute inset-1 rounded-xl bg-[var(--accent)]/18 blur-md" />
              {isExpanded ? (
                <MonitorPlay className="relative h-5 w-5 text-[var(--accent)]" />
              ) : (
                <Palette className="relative h-5 w-5 text-[var(--accent)]" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Mood Switcher</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Active theme: <span className="text-[var(--accent)]">{activeTheme.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-all duration-300 hover:border-[var(--accent)]/30 hover:bg-white/10"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse theme switcher" : "Expand theme switcher"}
          >
            {isExpanded ? "Hide themes" : "Show themes"}
            <ChevronUp
              className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-0" : "rotate-180"}`}
            />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-white/8 pt-3 sm:grid-cols-3">
            {themes.map((theme) => {
              const isActive = theme.key === activeTheme.key;

              return (
                <button
                  key={theme.key}
                  onClick={() => handleSelect(theme)}
                  className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                    isActive
                      ? "cinema-ring border-[var(--accent)]/50 bg-[var(--accent)]/12"
                      : "border-white/8 bg-black/10 hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:bg-white/6"
                  }`}
                >
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="animate-shimmer-slide absolute inset-y-0 left-0 w-24 -skew-x-12 bg-white/10" />
                  </span>
                  <span className="mb-3 flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: theme.vars["--accent"] }}
                    />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {theme.name}
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <span
                      className="h-7 flex-1 rounded-xl border border-white/10"
                      style={{ backgroundColor: theme.vars["--bg-primary"] }}
                    />
                    <span
                      className="h-7 flex-1 rounded-xl border border-white/10"
                      style={{ backgroundColor: theme.vars["--bg-secondary"] }}
                    />
                    <span
                      className="h-7 w-10 rounded-xl border border-white/10"
                      style={{ backgroundColor: theme.vars["--accent"] }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
