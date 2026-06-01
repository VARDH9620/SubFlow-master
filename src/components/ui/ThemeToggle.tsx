import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { flushSync } from 'react-dom';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = (e: React.MouseEvent) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.style.setProperty('--theme-origin-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-origin-y', `${y}px`);
    document.documentElement.style.setProperty('--theme-radius', `${endRadius}px`);

    const isGoingDark = nextTheme === 'dark';
    
    document.documentElement.classList.remove('transition-to-dark', 'transition-to-light');
    document.documentElement.classList.add(isGoingDark ? 'transition-to-dark' : 'transition-to-light');

    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-xl bg-muted/30 hover:bg-muted/80 transition-all border border-border/50 hover:shadow-sm animate-scaleIn"
      title={`Theme: ${theme}. Click to cycle.`}
    >
      {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
      {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
    </button>
  );
}
