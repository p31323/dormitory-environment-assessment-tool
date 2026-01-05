
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { supportedLanguages } from '../constants/translations';
import { LanguageCode } from '../types';
import { FaGlobe } from 'react-icons/fa';

const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useContext(LanguageContext);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as LanguageCode);
    };

    return (
        <div className="relative inline-block">
            <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
                value={language}
                onChange={handleLanguageChange}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
                {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;