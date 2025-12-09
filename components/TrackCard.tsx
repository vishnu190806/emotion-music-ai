import React, { useEffect, useRef, useState } from "react";
import type { Track, Emotion } from "../types";
import { EMOTION_COLORS } from "../constants";
import {
  motion,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

// --- Icons ---
const SpotifyIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
    <path d="M7 11.5c2.5-1 5.5-1.5 9 .5" />
    <path d="M6 8.5c3-1 6.5-1.5 10.5 .5" />
    <path d="M8 14.5c2-1 5-1.5 8 .5" />
  </svg>
);

const MusicNoteIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white/50 opacity-50"
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const PlayIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

// --- Animated Popularity ---
const AnimatedPopularity: React.FC<{
  popularity: number;
  emotion: Emotion;
}> = ({ popularity, emotion }) => {
  const count = useSpring(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const currentColors = EMOTION_COLORS[emotion];

  useEffect(() => {
    count.set(popularity);
  }, [popularity, count]);

  return (
    <div className="w-full flex items-center gap-2">
      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${currentColors.light} 0%, ${currentColors.solid} 50%, ${currentColors.dark} 100%)`,
            backgroundSize: "200% 100%",
          }}
          initial={{ width: "0%" }}
          whileInView={{ width: `${Math.max(0, Math.min(100, popularity))}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <motion.span
        className="font-mono text-xs"
        style={{ color: currentColors.light }}
      >
        {rounded}
      </motion.span>
      <span className="font-mono text-xs text-gray-500">%</span>
    </div>
  );
};

// --- Audio Visualizer ---
const AudioVisualizer: React.FC<{
  analyser: AnalyserNode;
  emotion: Emotion;
}> = ({ analyser, emotion }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { light, dark } = EMOTION_COLORS[emotion];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = canvas;
      canvas.width = Math.max(1, Math.floor(clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const render = () => {
      rafId = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(
          0,
          canvas.height,
          0,
          canvas.height - barHeight
        );
        gradient.addColorStop(0, dark);
        gradient.addColorStop(1, light);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    render();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [analyser, light, dark]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

// --- Track Card ---
interface TrackCardProps {
  track: Track;
  emotion: Emotion;
  index: number; // used for staggered entrance
}

const TrackCard: React.FC<TrackCardProps> = ({ track, emotion, index }) => {
  const { playPreview, currentlyPlaying, analyser } = useAudioPlayer();
  const isPlaying = currentlyPlaying === track.preview_url;
  const currentColors = EMOTION_COLORS[emotion];
  const [imageError, setImageError] = useState(false);

  const handlePlayClick = () => {
    if (!track.preview_url) return;
    playPreview(track.preview_url);
  };

  const handleOpenSpotify = () => {
    // Try Spotify URI first; if app isn't focused after a moment, open web URL as fallback
    try {
      window.location.href = track.uri; // e.g., spotify:track:...
    } catch {}
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(track.url, "_blank", "noopener,noreferrer");
      }
    }, 1200);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, y: 30 },
  } as const;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 12,
        delay: index * 0.075,
      }}
      whileHover={{ y: -10, scale: 1.05 }}
      className="relative rounded-2xl overflow-hidden group"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentColors.gradient} transition-all duration-500`}
      />

      <div className="relative p-1">
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 flex flex-col gap-4 h-full">
          <AnimatePresence>
            {isPlaying && analyser && (
              <motion.div
                className="h-10 w-full rounded-t-lg overflow-hidden bg-black/20"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "2.5rem", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <AudioVisualizer analyser={analyser} emotion={emotion} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="aspect-square rounded-lg overflow-hidden relative shadow-lg">
            {track.album_art && !imageError ? (
              <img
                src={track.album_art}
                alt={`${track.album} album art`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${currentColors.gradient} flex items-center justify-center`}
              >
                <MusicNoteIcon />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {track.preview_url && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  onClick={handlePlayClick}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: isPlaying ? 1 : 0.85,
                    scale: isPlaying ? 1 : 0.9,
                  }}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(0,0,0,0.7)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center border-2 border-white/20 transition-all duration-300"
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </motion.button>
              </div>
            )}
          </div>

          <div className="flex flex-col flex-grow">
            <h3 className="font-bold text-lg truncate text-white">
              {track.name}
            </h3>
            <p className="text-sm text-gray-400 truncate">{track.artist}</p>
            <p className="text-xs text-gray-500 truncate">{track.album}</p>

            <div className="mt-auto pt-4 flex flex-col gap-3">
              <AnimatedPopularity
                popularity={track.popularity}
                emotion={emotion}
              />
              <button
                onClick={handleOpenSpotify}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500/80 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors shadow-md hover:shadow-lg hover:shadow-green-500/30"
              >
                <SpotifyIcon /> Open Spotify
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Skeleton ---
export const TrackCardSkeleton: React.FC = () => (
  <div className="relative rounded-2xl overflow-hidden bg-white/5 p-1 animate-pulse">
    <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 flex flex-col gap-4 h-full">
      <div className="aspect-square rounded-lg bg-white/10" />
      <div className="flex flex-col flex-grow">
        <div className="h-6 w-3/4 bg-white/10 rounded mb-2" />
        <div className="h-4 w-1/2 bg-white/10 rounded" />
        <div className="mt-auto pt-4">
          <div className="h-2.5 w-full bg-white/10 rounded-full mb-2" />
          <div className="h-10 w-full bg-white/10 rounded-lg mt-3" />
        </div>
      </div>
    </div>
  </div>
);

export default TrackCard;
