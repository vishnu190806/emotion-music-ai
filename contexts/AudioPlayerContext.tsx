
import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

// --- Audio Player Context ---
interface AudioPlayerContextType {
  playPreview: (url: string) => void;
  stopPreview: () => void;
  currentlyPlaying: string | null;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentlyPlaying(null);
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    // Cleanup function to stop audio and close context when the provider unmounts
    return () => {
      stopPreview();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopPreview]);

  const playPreview = useCallback((url: string) => {
    if (currentlyPlaying === url) {
      stopPreview();
      return;
    }

    if (audioRef.current) {
      stopPreview();
    }

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
        const analyser = context.createAnalyser();
        analyser.fftSize = 128;
        analyserRef.current = analyser;
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
        return;
      }
    }
    
    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    
    // Re-create the source node each time a new audio element is used
    sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
    sourceRef.current.connect(analyserRef.current!);
    analyserRef.current!.connect(audioContextRef.current.destination);

    audio.play().then(() => {
      setCurrentlyPlaying(url);
      setIsPlaying(true);
    }).catch(err => {
      console.error("Audio playback failed:", err);
      // Ensure UI resets if play fails
      if (audioContextRef.current?.state === 'running') {
          stopPreview();
      }
    });

    audio.addEventListener('ended', stopPreview);
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('play', () => setIsPlaying(true));

  }, [currentlyPlaying, stopPreview]);

  const value = { playPreview, stopPreview, currentlyPlaying, analyser: analyserRef.current, isPlaying };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};