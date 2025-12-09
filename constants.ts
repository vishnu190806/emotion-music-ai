
import type { Emotion } from './types';

export const API_BASE_URL = 'http://localhost:5000/api';

export const EMOTION_POLL_INTERVAL = 2000; // 2 seconds

type ColorDefinition = {
  gradient: string;
  solid: string;
  glow: string;
  glowInner: string;
  light: string;
  dark: string;
};

export const EMOTION_COLORS: Record<Emotion, ColorDefinition> = {
  Happy:    { gradient: 'from-[#ffd60a] via-[#ff6b35] to-[#ff006e]', solid: '#ff6b35', glow: 'rgba(255, 107, 53, 0.4)', glowInner: 'rgba(255, 214, 10, 0.6)', light: '#ffd60a', dark: '#ff006e' },
  Sad:      { gradient: 'from-[#1e3a8a] via-[#6b21a8] to-[#312e81]', solid: '#6b21a8', glow: 'rgba(107, 33, 168, 0.4)', glowInner: 'rgba(30, 58, 138, 0.6)', light: '#1e3a8a', dark: '#312e81' },
  Angry:    { gradient: 'from-[#dc2626] via-[#f97316] to-[#f59e0b]', solid: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', glowInner: 'rgba(220, 38, 38, 0.6)', light: '#f97316', dark: '#dc2626' },
  Neutral:  { gradient: 'from-[#94a3b8] via-[#64748b] to-[#71717a]', solid: '#64748b', glow: 'rgba(100, 116, 139, 0.4)', glowInner: 'rgba(148, 163, 184, 0.6)', light: '#94a3b8', dark: '#71717a' },
  Surprise: { gradient: 'from-[#3b82f6] via-[#06b6d4] to-[#14b8a6]', solid: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', glowInner: 'rgba(59, 130, 246, 0.6)', light: '#3b82f6', dark: '#14b8a6' },
  Fear:     { gradient: 'from-[#7c3aed] via-[#a855f7] to-[#c026d3]', solid: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', glowInner: 'rgba(124, 58, 237, 0.6)', light: '#a855f7', dark: '#7c3aed' },
  Disgust:  { gradient: 'from-[#84cc16] via-[#a3e635] to-[#eab308]', solid: '#a3e635', glow: 'rgba(163, 230, 53, 0.4)', glowInner: 'rgba(132, 204, 22, 0.6)', light: '#a3e635', dark: '#eab308' },
  Unknown:  { gradient: 'from-gray-500 via-gray-600 to-gray-700', solid: '#6b7280', glow: 'rgba(107, 114, 128, 0.4)', glowInner: 'rgba(156, 163, 175, 0.6)', light: '#9ca3af', dark: '#4b5563' },
};

export const EMOTION_BG_GRADIENTS: Record<Emotion, string> = {
  Happy: 'linear-gradient(135deg, #ffd60a 0%, #ff6b35 50%, #ff006e 100%)',
  Sad: 'linear-gradient(135deg, #1e3a8a 0%, #6b21a8 50%, #312e81 100%)',
  Angry: 'linear-gradient(135deg, #dc2626 0%, #f97316 50%, #f59e0b 100%)',
  Neutral: 'linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #71717a 100%)',
  Surprise: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #14b8a6 100%)',
  Fear: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c026d3 100%)',
  Disgust: 'linear-gradient(135deg, #84cc16 0%, #a3e635 50%, #eab308 100%)',
  Unknown: 'linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #1f2937 100%)',
}

export const EMOTION_EMOJIS: Record<Emotion, string> = {
  Happy: '😊',
  Sad: '😢',
  Angry: '😠',
  Neutral: '😐',
  Surprise: '😲',
  Fear: '😨',
  Disgust: '🤢',
  Unknown: '🤔',
};

export const FLAG_EMOJIS: Record<string, string> = {
    'Mixed': '🌐',
    'English': '🇺🇸',
    'Hindi': '🇮🇳',
    'Spanish': '🇪🇸',
    'Korean': '🇰🇷',
    'Japanese': '🇯🇵',
    'Portuguese': '🇧🇷',
    'French': '🇫🇷',
    'Arabic': '🇸🇦',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'Chinese': '🇨🇳',
    'Tamil': '🇮🇳',
    'Telugu': '🇮🇳'
  };