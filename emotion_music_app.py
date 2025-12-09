import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import warnings
warnings.filterwarnings('ignore')

import cv2
import numpy as np
from collections import deque, Counter
import time
import tkinter as tk
from tkinter import ttk
import threading
from PIL import Image, ImageTk

try:
    from tensorflow.keras.models import load_model
except ImportError:
    from keras.models import load_model

from spotify_helper import SpotifyMoodRecommender

# ==================== CONFIGURATION ====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
MODEL_PATH = os.path.join(SRC_DIR, "model.h5")
CASCADE_PATH = os.path.join(SRC_DIR, "haarcascade_frontalface_default.xml")

EMOTIONS = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]

# Emotion detection settings
WINDOW_SIZE = 30
CONF_THRESHOLD = 0.40
COOLDOWN_SECONDS = 10.0
CLASS_WEIGHTS = {"Sad": 1.25, "Fear": 1.15, "Disgust": 1.2}

# ==================== FUNCTIONS ====================
def apply_clahe(gray_frame):
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray_frame)

# ==================== LOAD MODEL ====================
print("Loading Mini-XCEPTION model...")
model = load_model(MODEL_PATH, compile=False)
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)
print("✅ Emotion model loaded!")

# ==================== INITIALIZE SPOTIFY ====================
print("Connecting to Spotify...")
try:
    spotify = SpotifyMoodRecommender()
    print("✅ Spotify connected!")
    spotify_enabled = True
except Exception as e:
    print(f"❌ Spotify connection failed: {e}")
    spotify_enabled = False

# ==================== GUI APPLICATION ====================
class EmotionMusicApp:
    def __init__(self, window):
        self.window = window
        self.window.title("🎭 Emotion-Based Music Recommender")
        self.window.geometry("800x600")
        self.window.configure(bg='#1a1a1a')
        
        # State variables
        self.emotion_window = deque(maxlen=WINDOW_SIZE)
        self.current_emotion = "Neutral"
        self.last_emotion_change = 0.0
        self.running = True
        self.current_tracks = []
        
        # Create UI
        self.create_widgets()
        
        # Start webcam
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(1)
        
        # Start video thread
        self.video_thread = threading.Thread(target=self.update_video, daemon=True)
        self.video_thread.start()
    
    def create_widgets(self):
        # Title
        title_label = tk.Label(self.window, text="🎭🎵 Emotion-Based Music Recommender", 
                               font=("Helvetica", 18, "bold"), bg='#1a1a1a', fg='#00ff66')
        title_label.pack(pady=10)
        
        # Video frame
        self.video_label = tk.Label(self.window, bg='#000000')
        self.video_label.pack(pady=10)
        
        # Emotion display
        emotion_frame = tk.Frame(self.window, bg='#2a2a2a', relief='solid', bd=2)
        emotion_frame.pack(pady=10, padx=20, fill='x')
        
        tk.Label(emotion_frame, text="Current Emotion:", font=("Helvetica", 12), 
                bg='#2a2a2a', fg='#ffffff').pack(side='left', padx=10, pady=10)
        
        self.emotion_display = tk.Label(emotion_frame, text="Neutral", 
                                        font=("Helvetica", 14, "bold"), 
                                        bg='#2a2a2a', fg='#00ff66')
        self.emotion_display.pack(side='left', padx=10, pady=10)
        
        # Get Music Button
        self.music_button = tk.Button(self.window, text="🎵 Get Music for Current Emotion", 
                                      font=("Helvetica", 12, "bold"),
                                      bg='#00ff66', fg='#000000',
                                      activebackground='#00cc52',
                                      command=self.fetch_music,
                                      cursor='hand2',
                                      relief='raised', bd=3,
                                      padx=20, pady=10)
        self.music_button.pack(pady=15)
        
        # Track display area
        track_frame = tk.Frame(self.window, bg='#2a2a2a', relief='solid', bd=2)
        track_frame.pack(pady=10, padx=20, fill='both', expand=True)
        
        tk.Label(track_frame, text="🎵 Recommended Tracks:", 
                font=("Helvetica", 12, "bold"), bg='#2a2a2a', fg='#ffffff').pack(anchor='w', padx=10, pady=5)
        
        # Scrollable text widget
        self.track_text = tk.Text(track_frame, height=8, font=("Courier", 10),
                                  bg='#1a1a1a', fg='#ffffff', relief='flat',
                                  wrap='word', state='disabled')
        self.track_text.pack(padx=10, pady=5, fill='both', expand=True)
        
        # Status bar
        self.status_label = tk.Label(self.window, text="Ready | Press 'Get Music' button", 
                                     font=("Helvetica", 9), bg='#1a1a1a', fg='#888888')
        self.status_label.pack(side='bottom', fill='x', pady=5)
    
    def update_video(self):
        """Update video feed and detect emotions"""
        while self.running:
            ok, frame = self.cap.read()
            if not ok:
                break
            
            # Resize for display
            frame = cv2.resize(frame, (640, 480))
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray_enhanced = apply_clahe(gray)
            
            faces = face_cascade.detectMultiScale(
                gray_enhanced, 
                scaleFactor=1.1,
                minNeighbors=4,
                minSize=(30, 30)
            )
            
            for (x, y, w, h) in faces:
                roi = gray_enhanced[y:y+h, x:x+w]
                roi_resized = cv2.resize(roi, (64, 64))
                roi_norm = roi_resized.astype("float32") / 255.0
                roi_input = np.expand_dims(roi_norm, axis=(0, -1))
                
                preds = model.predict(roi_input, verbose=0)[0]
                
                preds_weighted = preds.copy()
                for i, emotion in enumerate(EMOTIONS):
                    if emotion in CLASS_WEIGHTS:
                        preds_weighted[i] *= CLASS_WEIGHTS[emotion]
                
                idx = int(np.argmax(preds_weighted))
                label = EMOTIONS[idx]
                conf = float(preds[idx])
                
                if conf >= CONF_THRESHOLD:
                    self.emotion_window.append(label)
                
                if len(self.emotion_window) >= 8:
                    emotion_counts = Counter(self.emotion_window)
                    most_common = emotion_counts.most_common(1)[0][0]
                    
                    now = time.time()
                    if self.current_emotion != most_common:
                        if (now - self.last_emotion_change) >= COOLDOWN_SECONDS:
                            self.current_emotion = most_common
                            self.last_emotion_change = now
                            self.emotion_display.config(text=self.current_emotion)
                
                # Draw on frame
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(frame, f"{self.current_emotion} ({conf:.2f})", (x, y-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Convert to ImageTk
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(frame_rgb)
            imgtk = ImageTk.PhotoImage(image=img)
            
            self.video_label.imgtk = imgtk
            self.video_label.configure(image=imgtk)
            
            time.sleep(0.03)  # ~30 FPS
    
    def fetch_music(self):
        """Fetch music for current emotion (button click handler)"""
        if not spotify_enabled:
            self.update_track_display("❌ Spotify not connected")
            return
        
        self.music_button.config(state='disabled', text="🔄 Fetching...")
        self.status_label.config(text=f"Fetching {self.current_emotion} music from Spotify...")
        
        def fetch():
            try:
                tracks = spotify.get_tracks_for_emotion(self.current_emotion, limit=5)
                self.current_tracks = tracks
                self.display_tracks(tracks)
                self.status_label.config(text=f"✅ Found {len(tracks)} tracks for {self.current_emotion}")
            except Exception as e:
                self.update_track_display(f"❌ Error: {e}")
                self.status_label.config(text="❌ Failed to fetch tracks")
            finally:
                self.music_button.config(state='normal', text="🎵 Get Music for Current Emotion")
        
        threading.Thread(target=fetch, daemon=True).start()
    
    def display_tracks(self, tracks):
        """Display tracks in the text widget"""
        self.track_text.config(state='normal')
        self.track_text.delete(1.0, tk.END)
        
        if not tracks:
            self.track_text.insert(tk.END, "No tracks found. Try again!")
        else:
            for i, track in enumerate(tracks, 1):
                self.track_text.insert(tk.END, f"{i}. {track['name']}\n", 'title')
                self.track_text.insert(tk.END, f"   Artist: {track['artist']}\n")
                self.track_text.insert(tk.END, f"   Popularity: {track['popularity']}/100\n")
                self.track_text.insert(tk.END, f"   🔗 {track['url']}\n\n", 'link')
        
        self.track_text.tag_config('title', foreground='#00ff66', font=('Courier', 10, 'bold'))
        self.track_text.tag_config('link', foreground='#66b3ff')
        self.track_text.config(state='disabled')
    
    def update_track_display(self, message):
        """Update track display with a message"""
        self.track_text.config(state='normal')
        self.track_text.delete(1.0, tk.END)
        self.track_text.insert(tk.END, message)
        self.track_text.config(state='disabled')
    
    def on_closing(self):
        """Clean up when window closes"""
        self.running = False
        if self.cap:
            self.cap.release()
        self.window.destroy()

# ==================== MAIN ====================
if __name__ == "__main__":
    print("\n" + "="*70)
    print("🎭🎵 EMOTION-BASED MUSIC RECOMMENDER")
    print("="*70)
    print("Starting GUI application...")
    print("="*70 + "\n")
    
    root = tk.Tk()
    app = EmotionMusicApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()
    
    print("\n✅ App closed!")