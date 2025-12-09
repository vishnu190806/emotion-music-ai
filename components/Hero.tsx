
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const useTypewriter = (text: string, speed: number = 50) => {
    const [displayText, setDisplayText] = useState('');
  
    useEffect(() => {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, speed);
  
      return () => {
        clearInterval(typingInterval);
      };
    }, [text, speed]);
  
    return displayText;
};

const Hero: React.FC = () => {
    const subtitleText = useTypewriter("Your vibe. Your soundtrack. Powered by emotion.");

    return (
        <motion.header 
            className="text-center py-8 md:py-12"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-widest relative inline-block glitch" data-text="EMOTION MUSIC AI">
                <span className="animated-gradient-text bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#ccff00] text-transparent bg-clip-text">
                    Emotion Music AI
                </span>
            </h1>
            <p className="mt-4 text-md sm:text-lg md:text-xl text-gray-300 tracking-wider h-7">
                {subtitleText}
                <span className="animate-ping">_</span>
            </p>
        </motion.header>
    );
};

export default Hero;