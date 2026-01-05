import React from 'react';
import { translations, Translation } from '../constants/translations';
import { LanguageCode } from '../types';

export const LanguageContext = React.createContext<{
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof Translation, replacements?: Record<string, string | number>) => string;
}>({
  language: 'zh-TW',
  setLanguage: () => {},
  t: (key: keyof Translation, replacements?: Record<string, string | number>) => {
    let text = translations['zh-TW'][key] || String(key);
     if (replacements) {
        for (const placeholder in replacements) {
            const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
            text = text.replace(regex, String(replacements[placeholder]));
        }
    }
    return text;
  },
});
