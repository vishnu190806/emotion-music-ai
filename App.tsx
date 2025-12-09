
import React, { useState, useEffect, useCallback } from 'react';
import type { EmotionData, Track, Emotion, LanguagesResponse } from './types';
import { API_BASE_URL, EMOTION_POLL_INTERVAL, EMOTION_COLORS, EMOTION_BG_GRADIENTS } from './constants';
import Hero from './components/Hero';
import WebcamCard from './components/WebcamCard';
import EmotionDisplayCard from './components/EmotionDisplayCard';
import ActionButton from './components/ActionButton';
import TrackGrid from './components/TrackGrid';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from './components/LanguageSelector';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';


// --- Main App Component ---
const App: React.FC = () => {
  const [emotionData, setEmotionData] = useState<EmotionData>({ emotion: 'Unknown', confidence: 0 });
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [tracksEmotion, setTracksEmotion] = useState<Emotion>('Unknown');
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>(['Mixed']);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Mixed');
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);

  useEffect(() => {
    const fetchEmotion = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/emotion`);
        if (!response.ok) throw new Error('Failed to fetch emotion data');
        const data: Partial<EmotionData> = await response.json();
        const validatedData: EmotionData = {
          emotion: data.emotion || 'Unknown',
          confidence: typeof data.confidence === 'number' ? data.confidence : 0,
        };
        setEmotionData(validatedData);
      } catch (err) {
        setEmotionData({ emotion: 'Unknown', confidence: 0 });
      }
    };
    
    const fetchLanguages = async () => {
      setIsLoadingLanguages(true);
      try {
        const response = await fetch(`${API_BASE_URL}/languages`);
        if (response.ok) {
          const data: LanguagesResponse = await response.json();
          const defaultLang = data.default || 'Mixed';
          const otherLangs = data.languages.filter(lang => lang !== defaultLang);
          setLanguages([defaultLang, ...otherLangs]);
          setSelectedLanguage(defaultLang);
        } else {
          // Fallback on error
          setLanguages(['Mixed', 'English', 'Hindi', 'Spanish']);
        }
      } catch (err) {
        console.error("Failed to fetch languages", err);
        // Fallback on error
        setLanguages(['Mixed', 'English', 'Hindi', 'Spanish']);
      } finally {
        setIsLoadingLanguages(false);
      }
    };

    const intervalId = setInterval(fetchEmotion, EMOTION_POLL_INTERVAL);
    fetchEmotion();
    fetchLanguages();

    return () => clearInterval(intervalId);
  }, []);
  
  const handleDiscoverMusic = useCallback(async (langOverride?: string) => {
    if (isLoadingTracks || emotionData.emotion === 'Unknown') return;
    setIsLoadingTracks(true);
    setError(null);
    setTracks(null);
    setTracksEmotion(emotionData.emotion);

    const languageToUse = langOverride || selectedLanguage;

    try {
      const response = await fetch(`${API_BASE_URL}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emotion: emotionData.emotion, language: languageToUse }),
      });
      if (!response.ok) throw new Error('Could not find tracks for your mood.');
      const data = await response.json();
      setTracks(data.tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setTracks([]);
    } finally {
      setIsLoadingTracks(false);
    }
  }, [isLoadingTracks, emotionData.emotion, selectedLanguage]);

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    // Auto-refresh if tracks have been searched for at least once and we're not loading.
    if (tracks !== null && !isLoadingTracks) {
      handleDiscoverMusic(newLanguage);
    }
  };

  const currentColors = EMOTION_COLORS[emotionData.emotion];
  
  const particleCount = 30;
  const particles = Array.from({ length: particleCount }).map((_, i) => (
    <div key={i} className="absolute rounded-full" style={{
        width: `${Math.random() * 5 + 2}px`,
        height: `${Math.random() * 5 + 2}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        backgroundColor: currentColors.solid,
        animation: `particle-float ${Math.random() * 10 + 10}s ease-in-out ${Math.random() * -20}s infinite`,
        opacity: Math.random() * 0.5 + 0.2,
    }}/>
  ));

  return (
    <AudioPlayerProvider>
      <div className="min-h-screen bg-[#0a0118] text-white overflow-hidden relative">
        <AnimatePresence>
            <motion.div
                key={emotionData.emotion}
                className="absolute inset-0 z-0 opacity-15"
                style={{ backgroundImage: EMOTION_BG_GRADIENTS[emotionData.emotion] }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            />
        </AnimatePresence>
        <div className="absolute inset-0 z-0 opacity-50 overflow-hidden">
          {particles}
        </div>
        <main className="relative z-10 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
          <Hero />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <WebcamCard emotion={emotionData.emotion} />
            </div>
            <div className="lg:col-span-2 flex flex-col gap-8">
              <EmotionDisplayCard emotionData={emotionData} />
              <LanguageSelector
                languages={languages}
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                emotion={emotionData.emotion}
                isLoading={isLoadingLanguages}
              />
              <ActionButton
                onClick={() => handleDiscoverMusic()}
                isLoading={isLoadingTracks}
                emotion={emotionData.emotion}
                disabled={emotionData.emotion === 'Unknown'}
              />
            </div>
          </div>
          <AnimatePresence>
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg"
                >
                    {error}
                </motion.div>
            )}
          </AnimatePresence>
          <TrackGrid tracks={tracks} isLoading={isLoadingTracks} emotion={tracksEmotion} selectedLanguage={selectedLanguage} />
        </main>
      </div>
    </AudioPlayerProvider>
  );
};

export default App;