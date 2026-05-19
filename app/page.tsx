"use client";

import { useEffect, useMemo, useState } from "react";

type HabitKey = "steps" | "water" | "calories" | "exercise" | "screenFree";

type DayState = Record<HabitKey, boolean>;
type AppState = Record<string, DayState>;

// TypeScript interface for the native PWA install prompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const initialState: DayState = {
  steps: false,
  water: false,
  calories: false,
  exercise: false,
  screenFree: false,
};

const STORAGE_KEY = "pulse-state-v2";

const habits: {
  key: HabitKey;
  label: string;
  emoji: string;
  color: string;
  darkColor: string; // Added dark mode background for emojis
}[] = [
  {
    key: "steps",
    label: "10K Steps",
    emoji: "👟",
    color: "bg-green-100",
    darkColor: "dark:bg-green-950/50",
  },
  {
    key: "water",
    label: "Drink Your Water",
    emoji: "💧",
    color: "bg-blue-100",
    darkColor: "dark:bg-blue-950/50",
  },
  {
    key: "calories",
    label: "Count Your Calories",
    emoji: "🔥",
    color: "bg-red-100",
    darkColor: "dark:bg-red-950/50",
  },
  {
    key: "exercise",
    label: "Exercise Today",
    emoji: "🏋️",
    color: "bg-purple-100",
    darkColor: "dark:bg-purple-950/50",
  },
  {
    key: "screenFree",
    label: "Screen Free Break",
    emoji: "🌞",
    color: "bg-yellow-100",
    darkColor: "dark:bg-yellow-950/50",
  },
];

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function PulseMVP() {
  const [date, setDate] = useState(getToday);
  const [allState, setAllState] = useState<AppState>({});
  const [hydrated, setHydrated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // PWA Installation state
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Listen to device settings and hydrate from storage AFTER mount
  useEffect(() => {
    // 1. Check system dark mode preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkMode(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", listener);

    // 2. Hydrate habit state
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      setAllState(parsed);
    } catch {
      setAllState({});
    } finally {
      setHydrated(true);
    }

    // 3. Listen for the native PWA install prompt
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    return () => {
      mediaQuery.removeEventListener("change", listener);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, []);

  // persist changes
  useEffect(() => {
    if (!hydrated) return;

    try {
      const serialized = JSON.stringify(allState);
      localStorage.setItem(STORAGE_KEY, serialized);
      sessionStorage.setItem(STORAGE_KEY, serialized);
    } catch {}
  }, [allState, hydrated]);

  const dayState: DayState = useMemo(() => {
    return {
      ...initialState,
      ...(allState[date] || {}),
    };
  }, [allState, date]);

  const displayDate = useMemo(() => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [date]);

  const toggle = (key: HabitKey) => {
    setAllState((prev) => {
      const current = prev[date] || initialState;
      return {
        ...prev,
        [date]: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  const changeDay = (offset: number) => {
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + offset);

    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setDate(newDate);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  const completed = Object.values(dayState).filter(Boolean).length;

  if (!hydrated) {
    return (
      <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-fuchsia-50 dark:bg-stone-950 transition-colors duration-200">
        <div className="text-sm text-gray-400 dark:text-stone-600">
          Loading…
        </div>
      </div>
    );
  }

  return (
    // We inject the `dark` class dynamically right here based on system state
    <div
      className={`h-screen w-screen overflow-hidden overscroll-none touch-none bg-fuchsia-50 flex flex-col items-center px-4 py-6 justify-center transition-colors duration-200 ${isDarkMode ? "dark bg-zinc-950" : ""}`}
    >
      <div className="w-full max-w-sm relative">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-zinc-50">
            Pulse
          </h1>
        </div>

        {/* Date Switcher */}
        <div className="mb-6 flex items-center justify-center gap-6">
          <button
            onClick={() => changeDay(-1)}
            className="text-4xl text-purple-400 dark:text-purple-500 p-2 active:opacity-70"
          >
            ‹
          </button>

          <div className="text-center select-none">
            <div className="text-lg font-medium text-purple-700 dark:text-purple-400">
              {displayDate.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="text-xs text-stone-400 dark:text-zinc-600">
              Daily view
            </div>
          </div>

          <button
            onClick={() => changeDay(1)}
            className="text-4xl text-purple-400 dark:text-purple-500 p-2 active:opacity-70"
          >
            ›
          </button>
        </div>

        {/* Progress */}
        <div className="text-xs text-gray-500 dark:text-zinc-400 mb-3 select-none">
          {completed} / 5 completed
        </div>

        {/* Habits */}
        <div className="space-y-3">
          {habits.map((h) => (
            <button
              key={h.key}
              onClick={() => toggle(h.key)}
              className="w-full flex items-center justify-between bg-white dark:bg-zinc-900 rounded-2xl px-4 py-4 active:scale-[0.99] transition-all border border-transparent dark:border-zinc-800/50 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${h.color} ${h.darkColor}`}
                >
                  <span>{h.emoji}</span>
                </div>

                <span className="text-sm font-medium text-gray-900 dark:text-zinc-200">
                  {h.label}
                </span>
              </div>

              <div
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                  dayState[h.key]
                    ? "bg-black border-black dark:bg-zinc-50 dark:border-zinc-50"
                    : "border-gray-300 dark:border-zinc-700"
                }`}
              >
                {dayState[h.key] && (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-white dark:text-zinc-950"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Install Button - Bottom Right */}
      {showInstallBtn && (
        <button
          onClick={handleInstallClick}
          title="Install to Home Screen"
          className="fixed bottom-6 right-6 p-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center z-50 group hover:pr-5"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 text-sm font-medium">
            Install App
          </span>
        </button>
      )}
    </div>
  );
}
