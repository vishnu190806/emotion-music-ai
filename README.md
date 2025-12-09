
# Emotion Music AI 🎭🎵

Your vibe. Your soundtrack. Powered by real-time emotion detection and AI-driven music recommendations.

---

## Overview
Emotion Music AI is a modern, cross-platform music recommendation system that uses your webcam to detect your facial emotion and instantly curates a personalized playlist from Spotify to match your mood. Inspired by state-of-the-art Deep Learning and global music discovery, this app is designed to deliver unique and fresh music experiences for every user, every time.

---

## Features

- 🎭 7-Emotion Detection via Mini-XCEPTION
- 🎵 Personalized Spotify music recommendations with diversity & deduplication
- 🌍 14+ languages, market-aware, and Mixed/Random mode
- 🎨 Modern, glassmorphic web frontend with real-time webcam and album art
- 🕘 Unique tracks per session, user, and emotion
- ⚡ Fast: <100ms detection, <500ms track fetch
- 🔒 Privacy-first: local image processing, secured API

---

## Quick Demo

1. **Run the backend:**
   ```bash
   python api_server.py
   ```
2. **Open frontend (Lovable/Google AI Studio):**
   - Allow webcam
   - Select language or "Mixed"
   - Make an expression (try Happy, Sad, Fear, Surprise...)
   - Click "Discover Music"
   - Enjoy unique recommendations, every time!

Screenshots and a video demo go here.

---

## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js (frontend optional)
- Webcam (built-in or external)
- Spotify Developer Account (for API keys)

### Setup Steps
1. **Clone the repo:**
    ```bash
    git clone <YOUR_REPO_URL>
    cd emotion-music-ai
    ```
2. **Backend dependencies:**
    ```bash
    python -m venv venv
    source venv/bin/activate   # Or venv\Scriptsctivate on Windows
    pip install -r requirements.txt
    ```
3. **.env configuration:**
    ```bash
    SPOTIFY_CLIENT_ID=your_client_id
    SPOTIFY_CLIENT_SECRET=your_client_secret
    ```
4. **Frontend:**
    - Use the generated Next.js/React frontend OR Lovable/Google AI Studio output
    - No config needed—just use the API at `http://localhost:5000`

5. **Download model/check src/model.h5 exists.**

---

## API Endpoints

- **GET /api/emotion** – Current detected emotion (JSON)
- **GET /api/languages** – List of available languages (JSON)
- **POST /api/tracks** – Get recommended tracks (emotion, language; unique each time, JSON)
- **GET /api/video_feed** – Live webcam stream
- **GET /api/snapshot** – Single frame image, emotion, and confidence (JSON)
- **GET /api/health** – API health/metadata

Request/response payloads & example curl commands available in `docs/API.md`.

---

## Architecture

- **Backend:** Flask API + TensorFlow/Keras Deep Learning model for emotion
- **Frontend:** React/Tailwind or AI-generated web UI (Lovable/Google AI Studio recommended)
- **Spotify Integration:** Spotipy (search, deduplication, language support)
- **Model:** Mini-XCEPTION trained for 7 emotions, enhanced weighting for Sad and Fear

```
(Webcam) → OpenCV/Face Detection → Mini-XCEPTION Model → Emotion → Flask API → Spotify API → Track Deduplication/Variety Engine → Frontend
```

---

## Customization & Extensibility

- **Languages:** Add/edit `LANGUAGE_CONFIG` and queries in `spotify_helper.py`
- **Emotion weights:** Tune detection in `api_server.py` for best accuracy
- **App integrations:** Easily swap UI for mobile/web/desktop
- **Spotify personalization:** (Planned v2) Add OAuth for liked/saved songs

---

## Contributing

Pull requests and feature ideas welcome! Please open an issue for improvements, more supported languages, bug fixes, or UI suggestions.

---

## License
MIT

---

## Credits
Project by [YourName].
Model: Mini-XCEPTION (O. Arriaga et al.). Spotipy + Spotify Developers. Based on research and open-source vision projects.
