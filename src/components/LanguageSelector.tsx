'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/translations';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  className = '',
}) => {
  const { language, setLanguage, options, currentOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-neutral-800 shadow-xs hover:border-[#F37021] hover:text-[#F37021] transition-all tap-target ${
          isOpen ? 'ring-2 ring-orange-500/20 border-[#F37021]' : ''
        }`}
        aria-label="Select Language (English, Chinese, Malay)"
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5 text-[#F37021] stroke-[2.2]" />
        <span className={compact ? 'hidden sm:inline' : 'inline'}>
          {currentOption.nativeName}
        </span>
        <span className={compact ? 'inline sm:hidden' : 'hidden font-mono'}>
          {currentOption.shortLabel}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#F37021]' : ''
          }`}
        />
      </button>

      {/* Apple-style Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur-xl p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 mb-1">
            Language / 语言 / Bahasa
          </div>
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.code === language;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleSelect(opt.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-all tap-target ${
                    isSelected
                      ? 'bg-orange-50 text-[#F37021] font-extrabold'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-600">
                      {opt.shortLabel}
                    </span>
                    <span>{opt.nativeName}</span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      ({opt.name})
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[#F37021] stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
