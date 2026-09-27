import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage, LANGUAGES, SupportedLanguage } from '../../lib/i18n';
import { sound } from '../../lib/audio';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLanguage = (code: SupportedLanguage) => {
    sound.playTick();
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-earth-900 hover:bg-earth-850 border border-earth-750 text-xs font-medium text-earth-200 transition-all cursor-pointer shadow-earth-sm hover:border-earth-600"
        title="Select Regulatory Language / भाषा चयन"
      >
        <span className="text-xs">{currentLang.flag}</span>
        <span className="hidden sm:inline font-sans text-[11px] text-earth-300">{currentLang.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-earth-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-earth-850 border border-earth-700 p-1.5 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-mono text-earth-400 uppercase tracking-wider border-b border-earth-750 mb-1">
            Institutional Language
          </div>
          <div className="space-y-0.5">
            {LANGUAGES.map((l) => {
              const isSelected = l.code === language;
              return (
                <button
                  key={l.code}
                  onClick={() => selectLanguage(l.code)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-bronze-500/15 text-bronze-400 font-semibold border border-bronze-500/30'
                      : 'text-earth-300 hover:bg-earth-800 hover:text-earth-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{l.flag}</span>
                    <span className="font-sans text-[11px]">{l.nativeName}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-bronze-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
