from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import numpy as np
from collections import deque, Counter
import time
import base64

try:
    from tensorflow.keras.models import load_model
except ImportError:
    from keras.models import load_model

from spotify_helper import SpotifyMoodRecommender, LANGUAGE_CONFIG
import os

app = Flask(__name__)
CORS(app)

# ==================== CONFIGURATION ====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
MODEL_PATH = os.path.join(SRC_DIR, "model.h5")
CASCADE_PATH = os.path.join(SRC_DIR, "haarcascade_frontalface_default.xml")

EMOTIONS = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]
WINDOW_SIZE = 30
CONF_THRESHOLD = 0.40

# Enhanced weights for difficult emotions
CLASS_WEIGHTS = {
    "Sad": 1.5,      # Boosted for better detection
    "Fear": 1.4,     # Boosted for better detection
    "Disgust": 1.2
}

# ==================== LOAD MODEL ====================
print("Loading model...")
model = load_model(MODEL_PATH, compile=False)
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)
print("✅ Model loaded!")

# Initialize Spotify
try:
    spotify = SpotifyMoodRecommender()
    spotify_enabled = True
except:
    spotify_enabled = False

# ==================== GLOBAL STATE ====================
emotion_window = deque(maxlen=WINDOW_SIZE)
current_emotion = "Neutral"
cap = cv2.VideoCapture(0)

def apply_clahe(gray_frame):
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray_frame)

def detect_emotion_from_frame(frame):
    """Detect emotion with enhanced preprocessing for Sad and Fear"""
    global current_emotion, emotion_window
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Enhanced preprocessing
    gray_enhanced = apply_clahe(gray)
    gray_enhanced = cv2.convertScaleAbs(gray_enhanced, alpha=1.2, beta=10)
    
    faces = face_cascade.detectMultiScale(
        gray_enhanced, 
        scaleFactor=1.1, 
        minNeighbors=4, 
        minSize=(30, 30)
    )
    
    detected_emotion = None
    confidence = 0.0
    face_coords = None
    
    for (x, y, w, h) in faces:
        roi = gray_enhanced[y:y+h, x:x+w]
        roi_resized = cv2.resize(roi, (64, 64))
        
        # Additional histogram equalization
        roi_resized = cv2.equalizeHist(roi_resized)
        
        roi_norm = roi_resized.astype("float32") / 255.0
        roi_input = np.expand_dims(roi_norm, axis=(0, -1))
        
        preds = model.predict(roi_input, verbose=0)[0]
        
        # Apply class weights
        preds_weighted = preds.copy()
        for i, emotion in enumerate(EMOTIONS):
            if emotion in CLASS_WEIGHTS:
                preds_weighted[i] *= CLASS_WEIGHTS[emotion]
        
        idx = int(np.argmax(preds_weighted))
        detected_emotion = EMOTIONS[idx]
        confidence = float(preds[idx])
        face_coords = (x, y, w, h)
        
        # Lower threshold for Sad and Fear
        adjusted_threshold = CONF_THRESHOLD
        if detected_emotion in ["Sad", "Fear"]:
            adjusted_threshold = 0.30
        
        if confidence >= adjusted_threshold:
            emotion_window.append(detected_emotion)
        
        if len(emotion_window) >= 8:
            emotion_counts = Counter(emotion_window)
            current_emotion = emotion_counts.most_common(1)[0][0]
        
        break
    
    return detected_emotion, confidence, face_coords

# ==================== API ENDPOINTS ====================

@app.route('/api/emotion', methods=['GET'])
def get_emotion():
    """Get current detected emotion"""
    return jsonify({
        'emotion': current_emotion,
        'timestamp': time.time()
    })

@app.route('/api/languages', methods=['GET'])
def get_languages():
    """Get list of available languages"""
    languages = list(LANGUAGE_CONFIG.keys())
    return jsonify({
        'languages': languages,
        'default': 'Mixed'
    })

@app.route('/api/tracks', methods=['POST'])
def get_tracks():
    """Get music tracks for emotion and language"""
    data = request.json
    emotion = data.get('emotion', current_emotion)
    language = data.get('language', 'Mixed')
    
    if not spotify_enabled:
        return jsonify({'error': 'Spotify not connected'}), 500
    
    tracks = spotify.get_tracks_for_emotion(emotion, limit=8, language=language)
    return jsonify({
        'emotion': emotion,
        'language': language,
        'tracks': tracks,
        'count': len(tracks)
    })

@app.route('/api/video_feed')
def video_feed():
    """Stream webcam with emotion overlay"""
    def generate():
        while True:
            success, frame = cap.read()
            if not success:
                break
            
            frame = cv2.resize(frame, (640, 480))
            detected_emotion, confidence, face_coords = detect_emotion_from_frame(frame)
            
            if face_coords:
                x, y, w, h = face_coords
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 100), 2)
                cv2.putText(frame, f"{current_emotion} ({confidence:.2f})", 
                           (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 100), 2)
            
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/snapshot', methods=['GET'])
def snapshot():
    """Get current frame as base64"""
    success, frame = cap.read()
    if not success:
        return jsonify({'error': 'Failed to capture'}), 500
    
    frame = cv2.resize(frame, (640, 480))
    detected_emotion, confidence, face_coords = detect_emotion_from_frame(frame)
    
    if face_coords:
        x, y, w, h = face_coords
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 100), 2)
    
    ret, buffer = cv2.imencode('.jpg', frame)
    frame_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return jsonify({
        'image': f'data:image/jpeg;base64,{frame_base64}',
        'emotion': current_emotion,
        'confidence': confidence if confidence else 0.0
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'online',
        'spotify': spotify_enabled,
        'model': 'Mini-XCEPTION (Enhanced)',
        'emotions': EMOTIONS,
        'languages': list(LANGUAGE_CONFIG.keys())
    })

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🎭🎵 EMOTION MUSIC API SERVER (Enhanced Detection)")
    print("="*70)
    print("API running at: http://localhost:5000")
    print("\nEndpoints:")
    print("  GET  /api/health       - Server status")
    print("  GET  /api/emotion      - Current emotion")
    print("  GET  /api/languages    - Available languages")
    print("  POST /api/tracks       - Get music recommendations")
    print("  GET  /api/video_feed   - Live webcam stream")
    print("  GET  /api/snapshot     - Single frame capture")
    print("\n💡 Tip: For Sad/Fear, hold expression for 3-5 seconds")
    print("="*70 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)