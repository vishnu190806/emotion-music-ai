
import React, { useState, useCallback } from 'react';
import type { Emotion } from '../types';
import { API_BASE_URL, EMOTION_COLORS } from '../constants';
import { motion } from 'framer-motion';

// Icons defined within the component file
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400" style={{filter: 'drop-shadow(0 0 5px currentColor)'}}>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle>
    </svg>
);

const RetryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
);

const WebcamErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-20 p-4">
        <motion.div
            className="w-full max-w-md text-center bg-black/40 backdrop-blur-2xl border-2 border-white/10 rounded-2xl p-8 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
        >
            <div className="animate-pulse">
                <CameraIcon />
            </div>
            <h3 className="text-xl font-bold mt-4 mb-2 text-white">Camera Access Needed</h3>
            <p className="text-gray-300 mb-6">We need your camera to detect emotions and find your vibe!</p>
            <ul className="text-left text-sm text-gray-400 space-y-2 mb-8">
                <li>✓ Allow camera permissions in your browser.</li>
                <li>✓ Ensure the backend is running at <code className="text-cyan-400 bg-black/50 px-1 rounded">localhost:5000</code>.</li>
            </ul>
            <div className="flex gap-4">
                <button
                    onClick={onRetry}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:scale-105 transition-transform shadow-lg hover:shadow-cyan-500/50"
                >
                    <RetryIcon />
                    Retry Connection
                </button>
                 <a
                    href={`${API_BASE_URL}/health`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/80 font-semibold rounded-lg hover:bg-white/20 transition-colors"
                >
                   Check Backend <ExternalLinkIcon />
                </a>
            </div>
        </motion.div>
    </div>
);


const WebcamCard: React.FC<{ emotion: Emotion }> = ({ emotion }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryKey, setRetryKey] = useState(new Date().getTime());
    const currentColors = EMOTION_COLORS[emotion];
    
    const handleRetry = useCallback(() => {
        setHasError(false);
        setIsLoading(true);
        setRetryKey(new Date().getTime());
    }, []);

    return (
        <motion.div
            className="relative p-1 rounded-3xl transition-all duration-700 ease-in-out"
            style={{ background: `linear-gradient(135deg, ${EMOTION_COLORS[emotion].glow}, #1a0b2e)` }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
        >
            <div 
                className="relative bg-black/50 backdrop-blur-2xl rounded-3xl p-2 h-full shadow-2xl overflow-hidden scanline-overlay aspect-[4/3]"
                style={{ '--glow-color': currentColors.glow, '--glow-color-inner': currentColors.glowInner } as React.CSSProperties}
            >
                <div className="absolute inset-0 holographic-border rounded-3xl transition-all duration-700" />
                <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-2 bg-red-600/80 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm border border-white/20">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        LIVE
                    </div>
                </div>

                {isLoading && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <div className="text-center">
                           <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                           <p>Initializing camera...</p>
                        </div>
                    </div>
                )}
                {hasError && <WebcamErrorState onRetry={handleRetry} />}
                
                <img 
                    src={`${API_BASE_URL}/video_feed?t=${retryKey}`} 
                    alt="Webcam Feed" 
                    className={`w-full h-full object-cover rounded-2xl transition-opacity duration-500 ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                />
                
                {!hasError && ['top-2 left-2', 'top-2 right-2 rotate-90', 'bottom-2 right-2 rotate-180', 'bottom-2 left-2 -rotate-90'].map(pos => (
                     <div key={pos} className={`absolute ${pos} w-8 h-8 border-cyan-400/50`} style={{borderStyle: 'solid', borderWidth: '2px 0 0 2px'}}></div>
                ))}
            </div>
        </motion.div>
    );
};

export default WebcamCard;