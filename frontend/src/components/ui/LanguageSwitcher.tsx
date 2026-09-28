import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../../lib/types';

interface LanguageSwitcherProps {
  current?: Language;
  currentLang?: Language;
  onChange?: (lang: Language) => void;
  onLanguageChange?: (lang: Language) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  current,
  currentLang,
  onChange,
  onLanguageChange,
}) => {
  const activeLang = current || currentLang || 'en';
  const handleChange = (l: Language) => {
    if (onChange) onChange(l);
    if (onLanguageChange) onLanguageChange(l);
  };

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 bg-panel border border-panel-border rounded-full p-0.5 sm:p-1 text-[11px] sm:text-xs">
      <Globe className="w-3.5 h-3.5 text-cyan ml-1 sm:ml-1.5 mr-0.5 hidden xs:inline-block" />
      <button
        type="button"
        onClick={() => handleChange('en')}
        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium transition-all ${
          activeLang === 'en'
            ? 'bg-cyan text-obsidian shadow-cyan-sm font-semibold'
            : 'text-off-white/70 hover:text-off-white hover:bg-white/5'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleChange('hi')}
        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium transition-all ${
          activeLang === 'hi'
            ? 'bg-cyan text-obsidian shadow-cyan-sm font-semibold'
            : 'text-off-white/70 hover:text-off-white hover:bg-white/5'
        }`}
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => handleChange('hinglish')}
        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium transition-all ${
          activeLang === 'hinglish'
            ? 'bg-cyan text-obsidian shadow-cyan-sm font-semibold'
            : 'text-off-white/70 hover:text-off-white hover:bg-white/5'
        }`}
      >
        Hinglish
      </button>
    </div>
  );
};

export default LanguageSwitcher;
