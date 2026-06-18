"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

type ThemeContext = {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (t: Theme) => void;
};

const Ctx = createContext<ThemeContext | null>(null);

// The blocking script in the root layout applies the class before paint; this
// IIFE string is shared so the two stay in sync. Reads localStorage "theme"
// ("dark" | "light" | "system"/absent → follow OS).
export const THEME_SCRIPT = `
(function(){try{var t=localStorage.getItem('theme');
var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(_){}})();
`;

function systemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(theme: Theme): Resolved {
  const dark = theme === "dark" || (theme === "system" && systemDark());
  const el = document.documentElement;
  el.classList.toggle("dark", dark);
  el.style.colorScheme = dark ? "dark" : "light";
  return dark ? "dark" : "light";
}

export function useTheme(): ThemeContext {
  return (
    useContext(Ctx) ?? {
      theme: "system",
      resolvedTheme: "light",
      setTheme: () => {},
    }
  );
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolved] = useState<Resolved>("light");

  // Sync state with what the blocking script already applied, and follow OS
  // changes while in "system" mode.
  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setThemeState(stored);
    setResolved(apply(stored));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem("theme") ?? "system") === "system") {
        setResolved(apply("system"));
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    if (t === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", t);
    setThemeState(t);
    setResolved(apply(t));
  }, []);

  return (
    <Ctx.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </Ctx.Provider>
  );
}
