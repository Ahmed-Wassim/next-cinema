"use client";

import { useEffect, useSyncExternalStore } from "react";

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border)] p-4">
      <div className="mx-auto max-w-4xl flex items-center justify-center gap-4">
        <span className="text-sm font-medium text-[var(--text-secondary)]">Theme:</span>
        {themes.map((theme) => (
          <button
            key={theme.key}
            onClick={() => handleSelect(theme)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              theme.key === activeTheme.key
                ? "bg-[var(--accent)] text-black shadow-[0_0_20px_var(--theme-glow)]"
                : "bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--accent)]/20"
            }`}
          >
            {theme.name}
          </button>
        ))}
      </div>
    </div>
  );
}
