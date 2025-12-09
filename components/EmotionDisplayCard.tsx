
import React from 'react';
import type { EmotionData } from '../types';
import { EMOTION_COLORS, EMOTION_EMOJIS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface EmotionDisplayCardProps {
    emotionData: EmotionData;
}

const EmotionDisplayCard: React.FC<EmotionDisplayCardProps> = ({ emotionData }) => {
    const { emotion } = emotionData;
    const currentColors = EMOTION_COLORS[emotion];
    const emoji = EMOTION_EMOJIS[emotion];

    return (
        <motion.div
            layout
            className={`relative p-8 rounded-3xl overflow-hidden flex flex-col items-center justify-center text-center bg-gradient-to-br ${currentColors.gradient} transition-shadow duration-1000`}
            initial={{ opacity: 0, y: 50, boxShadow: `0 0 5px ${currentColors.glow}, 0 0 10px ${currentColors.glow}` }}
            animate={{ 
                opacity: 1, 
                y: 0, 
                boxShadow: `0 0 40px ${currentColors.glow}, 0 0 80px ${currentColors.glow}`
            }}
            transition={{ duration: 0.7, delay: 0.4, type: "spring" }}
        >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-lg"></div>
            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="relative h-32 mb-4 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={emotion}
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 90 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="text-9xl"
                            style={{textShadow: '0 5px 25px rgba(0,0,0,0.5)'}}
                        >
                            {emoji}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <p className="text-gray-300">Currently feeling:</p>
                <h2 className="text-3xl font-black uppercase tracking-[0.2em] mt-1 transition-colors duration-1000" style={{color: currentColors.light, textShadow: `0 2px 10px ${currentColors.glow}`}}>
                    {emotion}
                </h2>
            </div>
        </motion.div>
    );
};

export default EmotionDisplayCard;