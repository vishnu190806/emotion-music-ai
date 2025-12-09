import React from "react";
import type { Track, Emotion } from "../types";
import TrackCard, { TrackCardSkeleton } from "./TrackCard";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface TrackGridProps {
  tracks: Track[] | null;
  isLoading: boolean;
  emotion: Emotion;
  selectedLanguage: string;
}

const SkeletonGrid: React.FC<{ count?: number }> = React.memo(
  ({ count = 8 }) => (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} />
      ))}
    </motion.div>
  )
);
SkeletonGrid.displayName = "SkeletonGrid";

const EmptyState: React.FC<{ language: string }> = ({ language }) => (
  <motion.div
    role="status"
    aria-live="polite"
    className="text-center py-16 text-gray-400"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <p className="text-2xl">
      No {language && language !== "Mixed" ? `${language} ` : ""}tracks found
      for this mood... yet.
    </p>
    <p>Try expressing a different emotion or changing the language!</p>
  </motion.div>
);

const TrackGrid: React.FC<TrackGridProps> = ({
  tracks,
  isLoading,
  emotion,
  selectedLanguage,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (isLoading) {
    return <SkeletonGrid />;
  }

  if (!tracks) return null;

  if (tracks.length === 0) {
    return <EmptyState language={selectedLanguage} />;
  }

  // No animation on the grid container itself; each card handles its own entrance (stagger via index)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <AnimatePresence initial={false}>
        {tracks.map((track, index) => {
          const key =
            (track as any).id || track.uri || `${track.name}-${index}`;
          return (
            <TrackCard
              key={key}
              track={track}
              emotion={emotion}
              index={prefersReducedMotion ? 0 : index}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default TrackGrid;
