import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const options = [
    { id: 'dark', label: 'Sombre', icon: Moon },
    { id: 'light', label: 'Clair', icon: Sun },
    { id: 'system', label: 'Système', icon: Laptop },
  ];

  if (compact) {
    const Icon = resolvedTheme === 'light' ? Sun : Moon;
    return (
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        className="p-2 rounded-lg text-[#F1F1E6]/60 hover:text-[#F1F1E6] hover:bg-white/5 transition"
        title="Basculer le thème"
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition ${
              active ? 'bg-white text-black' : 'text-[#F1F1E6]/70 hover:bg-white/10'
            }`}
            title={opt.label}
          >
            <Icon className="w-3.5 h-3.5" />
            {!compact ? opt.label : null}
          </button>
        );
      })}
    </div>
  );
}

