"use client";

import { useEffect, useMemo, useState } from "react";
import { showConfetti } from "./confetti";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type HabitKey = "steps" | "water" | "calories" | "exercise" | "screenFree";
type DayState = Record<HabitKey, boolean>;
type AppState = Record<string, DayState>;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type Habit = {
  key: HabitKey;
  label: string;
  emoji: string;
  color: string; // signature hex
  soft: string; // soft tint hex (for the icon chip when not done)
};

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "pulse-state-v2";

const initialState: DayState = {
  steps: false,
  water: false,
  calories: false,
  exercise: false,
  screenFree: false,
};

const habits: Habit[] = [
  {
    key: "steps",
    label: "10K Steps",
    emoji: "👟",
    color: "#22B85C",
    soft: "#D9F3E2",
  },
  {
    key: "water",
    label: "Drink Your Water",
    emoji: "💧",
    color: "#2E90FA",
    soft: "#D6EAFD",
  },
  {
    key: "calories",
    label: "Count Your Calories",
    emoji: "🔥",
    color: "#F4501E",
    soft: "#FFDFD3",
  },
  {
    key: "exercise",
    label: "Exercise Today",
    emoji: "🏋️",
    color: "#7C5CFF",
    soft: "#E2DAFF",
  },
  {
    key: "screenFree",
    label: "Screen-Free Break",
    emoji: "🌞",
    color: "#F5A623",
    soft: "#FFE8C2",
  },
];

// ──────────────────────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
const fmtKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const todayKey = () => fmtKey(new Date());
const isFuture = (k: string) => parseKey(k) > parseKey(todayKey());

function greetingFor(d: Date): { text: string; emoji: string } {
  const h = d.getHours();
  if (h < 5) return { text: "Late night", emoji: "🌙" };
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (h < 21) return { text: "Good evening", emoji: "🌆" };
  return { text: "Good night", emoji: "🌙" };
}

function calcStreak(state: AppState, dateKey: string): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = parseKey(dateKey);
    d.setDate(d.getDate() - i);
    const day = state[fmtKey(d)] || initialState;
    const perfect = habits.every((h) => day[h.key]);
    if (perfect) streak++;
    else if (i === 0)
      continue; // today not yet perfect — yesterday can still anchor
    else break;
  }
  return streak;
}

// ──────────────────────────────────────────────────────────────
// Tap sparkle: small color burst at the click coordinates
// ──────────────────────────────────────────────────────────────
function sparkleAt(x: number, y: number, color: string) {
  if (typeof document === "undefined") return;
  const root = document.createElement("div");
  root.style.cssText = `position:fixed;left:${x}px;top:${y}px;pointer-events:none;z-index:9998;`;
  document.body.appendChild(root);
  const N = 8;
  for (let i = 0; i < N; i++) {
    const dot = document.createElement("div");
    const ang = (i / N) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 28 + Math.random() * 22;
    dot.style.cssText = `
      position:absolute;left:-4px;top:-4px;width:8px;height:8px;
      border-radius:999px;background:${color};
      transform:translate(0,0) scale(1);opacity:1;
      transition:transform 600ms cubic-bezier(.2,.7,.3,1),opacity 600ms ease-out;
    `;
    root.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.transform = `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(0.2)`;
      dot.style.opacity = "0";
    });
  }
  window.setTimeout(() => root.remove(), 700);
}

// ──────────────────────────────────────────────────────────────
// Progress ring
// ──────────────────────────────────────────────────────────────
function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const size = 148;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dash = C * (completed / total);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="block"
        style={{ transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id="pulse-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="50%" stopColor="#2E90FA" />
            <stop offset="100%" stopColor="#22B85C" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-black/[0.06] dark:text-white/10"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#pulse-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C - dash}`}
          style={{
            transition: "stroke-dasharray 600ms cubic-bezier(.2,.7,.3,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
        <div className="text-5xl font-black tracking-tight tabular-nums leading-none text-gray-900 dark:text-zinc-50">
          {completed}
        </div>
        <div className="text-xs font-bold mt-1 text-gray-400 dark:text-zinc-500">
          of {total} habits
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 7-day weekstrip — tap a day to jump to it
// ──────────────────────────────────────────────────────────────
function WeekStrip({
  state,
  activeKey,
  onPick,
}: {
  state: AppState;
  activeKey: string;
  onPick: (key: string) => void;
}) {
  const days: Date[] = useMemo(() => {
    const today = parseKey(todayKey());
    const out: Date[] = [];
    for (let i = -6; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  return (
    <div className="flex gap-1.5 justify-between px-1">
      {days.map((d) => {
        const key = fmtKey(d);
        const ds = state[key] || initialState;
        const done = habits.filter((h) => ds[h.key]).length;
        const isActive = key === activeKey;
        const isTodayDay = key === todayKey();
        const perfect = done === 5;
        const pct = done / 5;
        return (
          <button
            key={key}
            onClick={() => onPick(key)}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 bg-transparent active:opacity-70 transition-opacity"
          >
            <div
              className={`text-[10px] font-extrabold tracking-wider ${
                isActive
                  ? "text-gray-900 dark:text-zinc-100"
                  : "text-gray-400 dark:text-zinc-600"
              }`}
            >
              {d
                .toLocaleDateString(undefined, { weekday: "short" })
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div className="relative w-7 h-7">
              <svg
                width="28"
                height="28"
                className="absolute inset-0"
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke="currentColor"
                  className="text-black/[0.08] dark:text-white/10"
                  strokeWidth="3"
                />
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke={perfect ? "#22B85C" : "#7C5CFF"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${pct * 2 * Math.PI * 11} 999`}
                />
              </svg>
              <div
                className={`absolute inset-0 flex items-center justify-center text-[11px] font-extrabold ${
                  perfect
                    ? "text-emerald-500"
                    : isActive
                      ? "text-gray-900 dark:text-zinc-100"
                      : "text-gray-400 dark:text-zinc-500"
                }`}
              >
                {perfect ? "✓" : d.getDate()}
              </div>
            </div>
            <div
              className="w-1 h-1 rounded-full"
              style={{
                background: isActive
                  ? isTodayDay
                    ? "#F4501E"
                    : "#1a1a1a"
                  : isTodayDay
                    ? "rgba(244,80,30,0.5)"
                    : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Habit tile — floods with the habit's signature color when done
// ──────────────────────────────────────────────────────────────
function HabitTile({
  habit,
  done,
  disabled,
  onToggle,
}: {
  habit: Habit;
  done: boolean;
  disabled: boolean;
  onToggle: (k: HabitKey, x: number, y: number, color: string) => void;
}) {
  const baseShadow = done
    ? `0 10px 24px ${habit.color}55, inset 0 2px 0 rgba(255,255,255,0.18)`
    : `0 1px 0 rgba(0,0,0,0.04), 0 8px 22px rgba(20,18,30,0.06)`;

  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onToggle(habit.key, r.right - 24, r.top + r.height / 2, habit.color);
      }}
      className={`relative w-full flex items-center gap-3.5 px-4 py-4 rounded-3xl text-left overflow-hidden select-none
        active:scale-[0.985] disabled:opacity-40 disabled:cursor-not-allowed
        transition-[background,box-shadow,transform] duration-300`}
      style={{
        background: done ? habit.color : "var(--tile-bg, #ffffff)",
        boxShadow: baseShadow,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* sweep shimmer when freshly completed */}
      {done && (
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-[pulseShine_700ms_cubic-bezier(0.2,0.7,0.3,1)_100ms_1]"
          style={{
            background:
              "linear-gradient(120deg,transparent 30%,rgba(255,255,255,0.35) 50%,transparent 70%)",
            transform: "translateX(-100%)",
          }}
        />
      )}

      {/* Emoji chip */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-colors duration-300"
        style={{ background: done ? "rgba(255,255,255,0.22)" : habit.soft }}
      >
        <span
          className="inline-block transition-transform duration-300"
          style={{
            transform: done ? "scale(1.15) rotate(-6deg)" : "scale(1)",
            filter: done ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none",
            transitionTimingFunction: "cubic-bezier(.2,1.6,.3,1)",
          }}
        >
          {habit.emoji}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div
          className="font-extrabold text-base tracking-tight transition-colors duration-300"
          style={{ color: done ? "#ffffff" : undefined }}
        >
          <span className={done ? "" : "text-gray-900 dark:text-zinc-100"}>
            {habit.label}
          </span>
        </div>
        <div
          className="text-xs font-semibold mt-0.5 transition-colors duration-300"
          style={{ color: done ? "rgba(255,255,255,0.85)" : undefined }}
        >
          <span className={done ? "" : "text-gray-400 dark:text-zinc-500"}>
            {done ? "Nice — done for today" : "Tap to mark complete"}
          </span>
        </div>
      </div>

      {/* Check pill */}
      <div
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
        style={{
          background: done ? "#ffffff" : "transparent",
          border: done ? "none" : "2px solid #d8d4cb",
          transitionTimingFunction: "cubic-bezier(.2,1.4,.3,1)",
        }}
      >
        {done && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5 L10 17.5 L19 7"
              stroke={habit.color}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 30,
                strokeDashoffset: 0,
                animation: "pulseCheck 360ms cubic-bezier(.2,.7,.3,1) forwards",
              }}
            />
          </svg>
        )}
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
export default function PulseMVP() {
  const [date, setDate] = useState(todayKey);
  const [allState, setAllState] = useState<AppState>({});
  const [hydrated, setHydrated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [streakKick, setStreakKick] = useState(0);

  // PWA install
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Boot: system dark mode + storage + PWA listener
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkMode(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mq.addEventListener("change", listener);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setAllState(raw ? JSON.parse(raw) : {});
    } catch {
      setAllState({});
    } finally {
      setHydrated(true);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBtn(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    return () => {
      mq.removeEventListener("change", listener);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    try {
      const s = JSON.stringify(allState);
      localStorage.setItem(STORAGE_KEY, s);
      sessionStorage.setItem(STORAGE_KEY, s);
    } catch {}
  }, [allState, hydrated]);

  const dayState: DayState = useMemo(
    () => ({ ...initialState, ...(allState[date] || {}) }),
    [allState, date],
  );
  const completed = habits.filter((h) => dayState[h.key]).length;
  const streak = useMemo(() => calcStreak(allState, date), [allState, date]);
  const displayDate = useMemo(() => parseKey(date), [date]);
  const isTodayView = date === todayKey();
  const disabled = isFuture(date);
  const greet = greetingFor(new Date());

  const headline = isTodayView
    ? completed === 5
      ? "You did it! 🎉"
      : completed === 0
        ? "Let's begin."
        : `${5 - completed} to go.`
    : displayDate.toLocaleDateString(undefined, { weekday: "long" });

  const toggle = (key: HabitKey, x: number, y: number, color: string) => {
    if (disabled) return;
    setAllState((prev) => {
      const cur = prev[date] || initialState;
      const wasDone = !!cur[key];
      const next = { ...cur, [key]: !wasDone };
      const newCount = habits.filter((h) => next[h.key]).length;
      if (!wasDone) {
        sparkleAt(x, y, color);
        if (newCount === 5) {
          try {
            showConfetti();
          } catch (err) {
            console.error(err);
          }
          setBanner("✨  PERFECT DAY  ✨");
          setStreakKick((k) => k + 1);
          window.setTimeout(() => setBanner(null), 2400);
        }
      }
      return { ...prev, [date]: next };
    });
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

  if (!hydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#faf8f3] dark:bg-zinc-950 transition-colors">
        <div className="text-sm text-gray-400 dark:text-zinc-600">Loading…</div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen w-screen overflow-hidden overscroll-none touch-none flex flex-col items-center px-4 py-6 justify-center transition-colors duration-200 ${
        isDarkMode ? "dark" : ""
      }`}
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #14141a 0%, #0c0c12 100%)"
          : "linear-gradient(180deg, #faf8f3 0%, #f4f0e6 100%)",
      }}
    >
      <div className="w-full max-w-sm relative flex flex-col h-full max-h-[760px]">
        {/* ── Top row: logo + streak ── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-lg tracking-tight"
              style={{
                background:
                  "linear-gradient(135deg, #7C5CFF 0%, #F4501E 50%, #F5A623 100%)",
                boxShadow: "0 6px 18px rgba(124,92,255,0.35)",
              }}
            >
              P
            </div>
            <div className="text-2xl font-black tracking-tight text-gray-900 dark:text-zinc-50">
              Pulse
            </div>
          </div>
          <div
            key={streakKick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-black ${
              streak > 0
                ? "text-white"
                : "text-gray-400 dark:text-zinc-500 bg-black/[0.04] dark:bg-white/[0.06]"
            } ${streakKick ? "animate-[streakPop_500ms_cubic-bezier(0.2,1.6,0.3,1)]" : ""}`}
            style={
              streak > 0
                ? {
                    background: "linear-gradient(135deg,#F4501E,#F5A623)",
                    boxShadow: "0 6px 16px rgba(244,80,30,0.3)",
                  }
                : undefined
            }
          >
            <span className="text-sm">🔥</span>
            <span>{streak}</span>
            <span className="font-bold opacity-70">
              day{streak === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* ── Headline + ring ── */}
        <div className="flex items-center justify-between gap-3 my-3">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold tracking-wide text-gray-400 dark:text-zinc-500">
              {greet.emoji}
              {"  "}
              {isTodayView ? greet.text : "Daily view"}
            </div>
            <div className="text-[28px] font-black tracking-tight mt-1 text-gray-900 dark:text-zinc-50">
              {headline}
            </div>
            <div className="text-[13px] font-semibold mt-1.5 text-gray-400 dark:text-zinc-500 flex items-center gap-2">
              {displayDate.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })}
              {!isTodayView && (
                <button
                  onClick={() => setDate(todayKey())}
                  className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 text-[11px] font-extrabold active:opacity-70"
                >
                  Today
                </button>
              )}
            </div>
          </div>
          <ProgressRing completed={completed} total={5} />
        </div>

        {/* ── Habits ── */}
        <div
          key={date}
          className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto animate-[fadeSwap_240ms_ease-out]"
          style={{ scrollbarWidth: "none" }}
        >
          {habits.map((h) => (
            <HabitTile
              key={h.key}
              habit={h}
              done={!!dayState[h.key]}
              disabled={disabled}
              onToggle={toggle}
            />
          ))}
        </div>

        {/* ── Weekstrip ── */}
        <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
          <div className="text-[10px] font-black tracking-[0.08em] text-gray-400 dark:text-zinc-600 mb-1.5 pl-1">
            THIS WEEK
          </div>
          <WeekStrip state={allState} activeKey={date} onPick={setDate} />
        </div>

        {/* ── Perfect-day banner ── */}
        {banner && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white font-black text-sm tracking-wider whitespace-nowrap z-50 animate-[bannerIn_420ms_cubic-bezier(0.2,1.6,0.3,1)]"
            style={{
              background: "linear-gradient(135deg,#FF6BB1,#F4501E,#F5A623)",
              boxShadow: "0 10px 30px rgba(244,80,30,0.4)",
            }}
          >
            {banner}
          </div>
        )}
      </div>

      {/* ── Floating PWA install ── */}
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
            strokeWidth={2.5}
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
