
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Emotion } from '../types';
import { EMOTION_COLORS, FLAG_EMOJIS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSelectorProps {
    languages: string[];
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
    emotion: Emotion;
    isLoading: boolean;
}

const getFlagEmoji = (language: string) => FLAG_EMOJIS[language] || '🌍';

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
    <motion.svg
        xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
    >
        <path d="m6 9 6 6 6-6"/>
    </motion.svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);


const LanguageSelector: React.FC<LanguageSelectorProps> = ({ languages, selectedLanguage, onLanguageChange, emotion, isLoading }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);
    const currentColors = EMOTION_COLORS[emotion];
    
    const handleSelect = (lang: string) => {
        onLanguageChange(lang);
        setIsOpen(false);
    };

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    if (isLoading) {
        return (
            <div className="relative">
                <div className="h-[76px] w-full rounded-2xl bg-white/5 animate-pulse"></div>
            </div>
        );
    }
    
    return (
        <motion.div
            ref={selectorRef}
            className="relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, type: "spring" }}
        >
            <div className="group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    className="relative w-full flex items-center justify-between bg-black/30 backdrop-blur-lg border-2 border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300"
                    style={{ '--tw-ring-color': currentColors.solid }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlagEmoji(selectedLanguage)}</span>
                        <div className="text-left">
                            <span className="text-xs text-gray-400">Language</span>
                            <span className="block font-semibold">{selectedLanguage}</span>
                        </div>
                    </div>
                    <div className="text-gray-400">
                        <ChevronDownIcon isOpen={isOpen} />
                    </div>
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute z-20 w-full mt-2 bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                        role="listbox"
                    >
                        {languages.map((lang, index) => (
                            <li key={lang} className={`px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors duration-200 ${lang === selectedLanguage ? 'font-bold' : ''}`}
                                onClick={() => handleSelect(lang)}
                                role="option"
                                aria-selected={lang === selectedLanguage}
                                style={{ color: lang === selectedLanguage ? currentColors.light : 'white' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{getFlagEmoji(lang)}</span>
                                        <span>{lang}</span>
                                    </div>
                                    {lang === selectedLanguage && <CheckIcon />}
                                </div>
                                {index === 0 && <hr className="border-t border-white/10 my-2" />}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LanguageSelector;