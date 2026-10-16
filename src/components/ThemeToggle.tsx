'use client';

import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeToggle() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('dineflow-theme');
    const initialTheme: Theme = savedTheme === 'light' ? 'light' : 'dark';
    applyTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    window.localStorage.setItem('dineflow-theme', nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light and dark appearance"
      title="Toggle light and dark appearance"
      className="theme-toggle inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-slate-100 hover:text-[#0F172A] cursor-pointer shadow-xs"
    >
      <Sun className="theme-sun h-4 w-4" />
      <Moon className="theme-moon h-4 w-4" />
    </button>
  );
}
