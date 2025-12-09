
export type Emotion = 'Happy' | 'Sad' | 'Angry' | 'Neutral' | 'Surprise' | 'Fear' | 'Disgust' | 'Unknown';

export interface EmotionData {
  emotion: Emotion;
  confidence: number;
}

export interface Track {
  name: string;
  artist: string;
  album: string;
  album_art: string | null;
  popularity: number;
  url: string;
  preview_url: string | null;
  uri: string;
}

export interface TracksResponse {
    emotion: Emotion;
    tracks: Track[];
}

export interface LanguagesResponse {
    languages: string[];
    default: string;
}