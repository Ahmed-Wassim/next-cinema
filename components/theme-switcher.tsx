"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Palette, X } from "lucide-react";

type ThemeKey = "cinematic" | "luxury" | "neon";

type Theme = {
  name: string;
  key: ThemeKey;
  vars: Record<string, string>;
  glow: string;
};

const themes: Theme[] = [
  {
    name: "Classic",
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
    name: "Luxury",
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

const panelTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
} as const;

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
  return (
    getThemeByKey(window.localStorage.getItem(STORAGE_KEY))?.key ?? themes[0].key
  );
}

function getThemeKeyServerSnapshot() {
  return themes[0].key;
}

export default function ThemeSwitcher() {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeThemeKey = useSyncExternalStore(
    subscribe,
    getThemeKeySnapshot,
    getThemeKeyServerSnapshot,
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
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
            transition={panelTransition}
            className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/80 p-2 backdrop-blur-xl shadow-2xl min-w-[160px]"
          >
            <div className="px-2 py-1 mb-1 border-b border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Pick Style</p>
            </div>
            {themes.map((theme) => {
              const isActive = theme.key === activeTheme.key;
              return (
                <button
                  key={theme.key}
                  onClick={() => handleSelect(theme)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/5 ${
                    isActive ? "bg-white/10" : ""
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: theme.vars["--accent"] }}
                  />
                  <span className={`text-xs font-medium ${isActive ? "text-white" : "text-zinc-400"}`}>
                    {theme.name}
                  </span>
                  {isActive && (
                      <motion.span 
                        layoutId="active-dot"
                        className="ml-auto flex h-1 w-1 rounded-full bg-[var(--accent)]" 
                      />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white shadow-lg backdrop-blur-md transition-colors hover:border-[var(--accent)]/50"
      >
        <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-10 animate-pulse" />
        {isExpanded ? (
          <X className="h-4 w-4 relative z-10" />
        ) : (
          <Palette className="h-4 w-4 relative z-10" />
        )}
      </motion.button>
    </div>
  );
}
