import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import os
from dotenv import load_dotenv
import random
import time

# Load environment variables
load_dotenv()

# Language market codes and search modifiers
LANGUAGE_CONFIG = {
    "Mixed": {
        "markets": ["US", "IN", "GB", "BR", "KR", "JP", "ES", "FR", "DE", "IT"],
        "search_suffix": ""
    },
    "English": {
        "markets": ["US", "GB", "CA", "AU"],
        "search_suffix": ""
    },
    "Hindi": {
        "markets": ["IN"],
        "search_suffix": " hindi bollywood"
    },
    "Spanish": {
        "markets": ["ES", "MX", "AR"],
        "search_suffix": " spanish latino"
    },
    "Korean": {
        "markets": ["KR"],
        "search_suffix": " kpop korean"
    },
    "Japanese": {
        "markets": ["JP"],
        "search_suffix": " jpop japanese"
    },
    "Portuguese": {
        "markets": ["BR", "PT"],
        "search_suffix": " portuguese brasileiro"
    },
    "French": {
        "markets": ["FR"],
        "search_suffix": " french"
    },
    "Arabic": {
        "markets": ["AE", "SA", "EG"],
        "search_suffix": " arabic"
    },
    "German": {
        "markets": ["DE", "AT"],
        "search_suffix": " german deutsch"
    },
    "Italian": {
        "markets": ["IT"],
        "search_suffix": " italian italiano"
    },
    "Chinese": {
        "markets": ["TW", "HK"],
        "search_suffix": " mandarin chinese cpop"
    },
    "Tamil": {
        "markets": ["IN"],
        "search_suffix": " tamil kollywood"
    },
    "Telugu": {
        "markets": ["IN"],
        "search_suffix": " telugu tollywood"
    }
}

# Emotion to music search queries (with variety)
EMOTION_TO_SEARCH = {
    "Happy": [
        "happy upbeat positive cheerful",
        "feel good pop dance",
        "energetic party hits",
        "joyful celebration music"
    ],
    "Sad": [
        "sad melancholy emotional heartbreak",
        "emotional ballad tearjerker",
        "breakup songs crying",
        "sad piano acoustic"
    ],
    "Angry": [
        "angry intense aggressive rock",
        "metal hardcore rage",
        "angry rap hip hop",
        "hard rock heavy"
    ],
    "Neutral": [
        "chill relaxing ambient calm",
        "study focus concentration",
        "lofi chill beats",
        "peaceful instrumental"
    ],
    "Surprise": [
        "exciting energetic upbeat dynamic",
        "pump up workout energy",
        "epic motivational powerful",
        "hype intense adrenaline"
    ],
    "Fear": [
        "dark suspense atmospheric tension",
        "thriller horror soundtrack",
        "dramatic tense cinematic",
        "eerie mysterious ambient"
    ],
    "Disgust": [
        "alternative grunge edgy industrial",
        "punk rock rebellious",
        "dark alternative indie",
        "goth industrial metal"
    ]
}

class SpotifyMoodRecommender:
    """Spotify music recommender with maximum variety and multi-language support"""
    
    def __init__(self):
        """Initialize Spotify client with Client Credentials"""
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        
        if not self.client_id or not self.client_secret:
            raise ValueError("Spotify credentials not found in .env file!")
        
        auth_manager = SpotifyClientCredentials(
            client_id=self.client_id,
            client_secret=self.client_secret
        )
        self.sp = spotipy.Spotify(auth_manager=auth_manager)
        
        print("✅ Spotify client initialized!")
    
    def get_tracks_for_emotion(self, emotion, limit=5, language="Mixed"):
        """
        Search for diverse tracks with maximum variety
        Different results for each user and each search
        
        Args:
            emotion: One of the 7 emotions
            limit: Number of tracks to return
            language: Language preference
            
        Returns:
            List of track dictionaries (unique each time)
        """
        if emotion not in EMOTION_TO_SEARCH:
            emotion = "Neutral"
        
        # Get language config
        lang_config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["Mixed"])
        market = random.choice(lang_config["markets"])
        search_suffix = lang_config["search_suffix"]
        
        # Time-based randomization for different results per user/session
        random_seed = int(time.time() * 1000) % 10000
        random.seed(random_seed)
        
        # Pick random query
        queries = EMOTION_TO_SEARCH[emotion]
        query = random.choice(queries)
        full_query = query + search_suffix
        
        try:
            all_items = []
            
            # Make 2 searches with different offsets for variety
            for _ in range(2):
                search_offset = random.randint(0, 100)
                
                results = self.sp.search(
                    q=full_query, 
                    type='track', 
                    limit=limit * 3,
                    market=market,
                    offset=search_offset
                )
                
                items = (results or {}).get('tracks', {}).get('items', []) or []
                all_items.extend(items)
            
            # Shuffle for randomness
            random.shuffle(all_items)
            
            tracks = []
            seen_track_names = set()
            artist_count = {}
            
            # Sort by popularity with random adjustment
            items_sorted = sorted(
                all_items, 
                key=lambda x: x.get('popularity', 0) + random.randint(-20, 20), 
                reverse=True
            )
            
            for t in items_sorted:
                if len(tracks) >= limit:
                    break
                
                name = (t or {}).get('name') or "Untitled"
                artists = (t or {}).get('artists') or []
                artist = (artists[0].get('name') if artists and artists[0] else "Unknown")
                
                track_key = f"{name.lower()}_{artist.lower()}"
                
                # Skip duplicates
                if track_key in seen_track_names:
                    continue
                
                # Max 2 tracks per artist
                if artist_count.get(artist, 0) >= 2:
                    continue
                
                # Get album info
                album_obj = (t or {}).get('album') or {}
                album_name = album_obj.get('name') or ""
                album_images = album_obj.get('images') or []
                
                album_art = None
                if album_images:
                    album_art = next((img['url'] for img in album_images if img.get('height') == 300), None)
                    if not album_art and album_images:
                        album_art = album_images[0].get('url')
                
                preview_url = (t or {}).get('preview_url')
                url = ((t or {}).get('external_urls') or {}).get('spotify') or ""
                uri = (t or {}).get('uri') or ""
                popularity = (t or {}).get('popularity', 0)
                
                tracks.append({
                    'name': name,
                    'artist': artist,
                    'album': album_name,
                    'album_art': album_art,
                    'preview_url': preview_url,
                    'url': url,
                    'uri': uri,
                    'popularity': popularity
                })
                
                seen_track_names.add(track_key)
                artist_count[artist] = artist_count.get(artist, 0) + 1
            
            # Reset random seed
            random.seed()
            
            return tracks
        
        except Exception as e:
            print(f"❌ Error searching tracks: {e}")
            random.seed()
            return []
    
    def get_playlists_for_emotion(self, emotion, limit=5):
        """
        Search for popular playlists matching the emotion
        
        Args:
            emotion: Detected emotion
            limit: Number of playlists
            
        Returns:
            List of playlist dictionaries
        """
        if emotion not in EMOTION_TO_SEARCH:
            emotion = "Neutral"
        
        queries = EMOTION_TO_SEARCH[emotion]
        query = random.choice(queries)
        
        try:
            offset = random.randint(0, 10)
            
            results = self.sp.search(
                q=query, 
                type='playlist', 
                limit=limit,
                market='US',
                offset=offset
            )
            
            playlists = []
            items = (results or {}).get('playlists', {}).get('items', []) or []
            
            for pl in items:
                name = (pl or {}).get('name') or "Untitled Playlist"
                owner = ((pl or {}).get('owner') or {}).get('display_name') or "Unknown"
                url = ((pl or {}).get('external_urls') or {}).get('spotify') or ""
                tracks_total = ((pl or {}).get('tracks') or {}).get('total') or 0
                description = (pl or {}).get('description') or ""
                
                playlists.append({
                    'name': name,
                    'owner': owner,
                    'url': url,
                    'tracks': tracks_total,
                    'description': description
                })
            
            return playlists
        
        except Exception as e:
            print(f"❌ Error searching playlists: {e}")
            return []

# Quick test function
def test_spotify_connection():
    """Test Spotify API with variety and languages"""
    try:
        recommender = SpotifyMoodRecommender()
        
        print("\n🧪 Testing Spotify with Maximum Variety...")
        print("="*70)
        
        # Test variety - same emotion multiple times
        print("\n🔄 Testing variety (same emotion, multiple searches)...")
        for i in range(3):
            print(f"\n  Search #{i+1}:")
            tracks = recommender.get_tracks_for_emotion("Happy", limit=3, language="English")
            for track in tracks:
                print(f"    • {track['name']} - {track['artist']}")
            time.sleep(0.5)
        
        # Test languages
        print("\n🌍 Testing different languages...")
        for lang in ["English", "Hindi", "Korean"]:
            tracks = recommender.get_tracks_for_emotion("Happy", limit=2, language=lang)
            if tracks:
                print(f"  ✅ {lang}: {tracks[0]['name']} - {tracks[0]['artist']}")
        
        return True
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_spotify_connection()
