"use client";

import { useState } from "react";

type HabitKey = "steps" | "water" | "calories" | "exercise" | "screenFree";

type DayState = Record<HabitKey, boolean>;

const initialState: DayState = {
  steps: false,
  water: false,
  calories: false,
  exercise: false,
  screenFree: false,
};

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

export default function PulseMVP() {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const [state, setState] = useState<DayState>(initialState);

  const toggle = (key: HabitKey) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completed = Object.values(state).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-fuchsia-50 flex justify-center px-4 py-6">
      <div className="w-full max-w-sm relative">
        {/* Top Bar */}
        <div className="flex items-center text-center justify-center mb-4">
          <h1 className="text-4xl font-bold">Pulse</h1>
        </div>

        {/* Date Switcher */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex items-center gap-6">
            {/* Left button */}
            <button className="text-2xl text-purple-400 hover:text-gray-600 transition">
              ‹
            </button>

            {/* Date block */}
            <div className="text-center leading-tight">
              <div className="text-lg font-medium text-purple-700">
                {new Date(date).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              <div className="text-xs text-stone-400 mt-1">Today</div>
            </div>

            {/* Right button */}
            <button className="text-2xl text-purple-400 hover:text-gray-600 transition">
              ›
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="text-xs text-gray-500 mb-3">
          {completed}/5 completed
        </div>

        {/* Habit Cards */}
        <div className="space-y-3">
          {habits.map((h) => (
            <button
              key={h.key}
              onClick={() => toggle(h.key)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-4  active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${h.color}`}
                >
                  <span className="text-lg">{h.emoji}</span>
                </div>

                <span className="text-sm font-medium">{h.label}</span>
              </div>

              <div
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition
                ${
                  state[h.key]
                    ? "bg-black border-black"
                    : "border-gray-300 bg-white"
                }`}
              >
                {state[h.key] && (
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
