"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";

function apply(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    let saved: Mode = "system";
    try {
      saved = (localStorage.getItem("rv_theme") as Mode) || "system";
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(saved);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let current: Mode = "system";
      try {
        current = (localStorage.getItem("rv_theme") as Mode) || "system";
      } catch {
        /* ignore */
      }
      if (current === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
  const labels: Record<Mode, string> = { system: "Thème : automatique", light: "Thème : clair", dark: "Thème : sombre" };
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={() => {
        const m = next[mode];
        setMode(m);
        try {
          localStorage.setItem("rv_theme", m);
        } catch {
          /* ignore */
        }
        apply(m);
      }}
      className="inline-flex size-10 items-center justify-center rounded-xl text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
      aria-label={`${labels[mode]} (cliquer pour changer)`}
      title={labels[mode]}
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  );
}

/** Inline script (runs before paint) to avoid a flash of the wrong theme. */
export const themeInitScript = `(function(){try{var m=localStorage.getItem('rv_theme')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;
