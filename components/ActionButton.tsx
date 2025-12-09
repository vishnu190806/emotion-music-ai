
import React from 'react';
import type { Emotion } from '../types';
import { EMOTION_COLORS } from '../constants';
import { motion } from 'framer-motion';

interface ActionButtonProps {
    onClick: () => void;
    isLoading: boolean;
    emotion: Emotion;
    disabled: boolean;
}

const MusicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
);


const ActionButton: React.FC<ActionButtonProps> = ({ onClick, isLoading, emotion, disabled }) => {
    const currentColors = EMOTION_COLORS[emotion];
    
    return (
        <motion.button
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`relative w-full h-24 rounded-3xl font-bold text-xl uppercase tracking-widest flex items-center justify-center overflow-hidden transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900`}
            style={{
                boxShadow: `0 8px 32px ${currentColors.glow}, 0 4px 12px ${currentColors.glowInner}`,
                '--ring-color': currentColors.solid,
                backgroundImage: `linear-gradient(135deg, ${currentColors.gradient.split(' ')[0].replace('from-', '')} 0%, ${currentColors.gradient.split(' ')[2].replace('to-', '')} 100%)`
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, type: "spring" }}
            whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -5 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
            <span className={`relative z-10 flex items-center gap-3 transition-opacity duration-300 ${disabled ? 'opacity-50' : 'opacity-100'}`}>
                {isLoading ? (
                    <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                    </>
                ) : (
                    <>
                        <MusicIcon />
                        <span>Discover Music</span>
                    </>
                )}
            </span>
             {/* Ripple Effect Container */}
            <div className={`absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isLoading ? 'animate-pulse' : ''}`}/>
        </motion.button>
    );
};

export default ActionButton;