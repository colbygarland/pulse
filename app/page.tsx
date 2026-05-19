"use client";

import { useEffect, useMemo, useState } from "react";

type HabitKey = "steps" | "water" | "calories" | "exercise" | "screenFree";

type DayState = Record<HabitKey, boolean>;
type AppState = Record<string, DayState>;

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
}[] = [
  { key: "steps", label: "10K Steps", emoji: "👟", color: "bg-green-100" },
  {
    key: "water",
    label: "Drink Your Water",
    emoji: "💧",
    color: "bg-blue-100",
  },
  {
    key: "calories",
    label: "Count Your Calories",
    emoji: "🔥",
    color: "bg-red-100",
  },
  {
    key: "exercise",
    label: "Exercise Today",
    emoji: "🏋️",
    color: "bg-purple-100",
  },
  {
    key: "screenFree",
    label: "Screen Free Break",
    emoji: "🌞",
    color: "bg-yellow-100",
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

  // hydrate from storage AFTER mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllState(parsed);
    } catch {
      setAllState({});
    } finally {
      setHydrated(true);
    }
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

  // Safely parse the YYYY-MM-DD string into a true local Date object
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

    const d = new Date(year, month - 1, day); // local date, no UTC shift
    d.setDate(d.getDate() + offset);

    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;

    setDate(newDate);
  };

  const completed = Object.values(dayState).filter(Boolean).length;

  // Hydration guard (prevents mismatch)
  if (!hydrated) {
    return (
      <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-fuchsia-50">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden overscroll-none touch-none bg-fuchsia-50 flex flex-col items-center px-4 py-6 justify-center">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-5xl font-bold">Pulse</h1>
        </div>

        {/* Date Switcher */}
        <div className="mb-6 flex items-center justify-center gap-6">
          <button
            onClick={() => changeDay(-1)}
            className="text-4xl text-purple-400 p-2"
          >
            ‹
          </button>

          <div className="text-center select-none">
            <div className="text-lg font-medium text-purple-700">
              {displayDate.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="text-xs text-stone-400">Daily view</div>
          </div>

          <button
            onClick={() => changeDay(1)}
            className="text-4xl text-purple-400 p-2"
          >
            ›
          </button>
        </div>

        {/* Progress */}
        <div className="text-xs text-gray-500 mb-3 select-none">
          {completed} / 5 completed
        </div>

        {/* Habits */}
        <div className="space-y-3">
          {habits.map((h) => (
            <button
              key={h.key}
              onClick={() => toggle(h.key)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-4  active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${h.color}`}
                >
                  <span>{h.emoji}</span>
                </div>

                <span className="text-sm font-medium">{h.label}</span>
              </div>

              <div
                className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                  dayState[h.key] ? "bg-black border-black" : "border-gray-300"
                }`}
              >
                {dayState[h.key] && (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-white"
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
    </div>
  );
}
