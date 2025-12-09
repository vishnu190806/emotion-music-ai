import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import warnings
warnings.filterwarnings('ignore')

import cv2
import numpy as np
from collections import deque, Counter
import time

try:
    from tensorflow.keras.models import load_model
except ImportError:
    from keras.models import load_model

# ==================== CONFIGURATION ====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
MODEL_PATH = os.path.join(SRC_DIR, "model.h5")
CASCADE_PATH = os.path.join(SRC_DIR, "haarcascade_frontalface_default.xml")

# Mini-XCEPTION emotions (7 classes, FER2013 trained)
EMOTIONS = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]

# Accuracy improvement settings
WINDOW_SIZE = 25
CONF_THRESHOLD = 0.35
COOLDOWN_SECONDS = 1.2
CLASS_WEIGHTS = {
    "Sad": 1.25,
    "Fear": 1.15,
    "Disgust": 1.2
}

# ==================== FUNCTIONS ====================
def apply_clahe(gray_frame):
    """Apply CLAHE to normalize lighting"""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray_frame)

# ==================== LOAD MODEL ====================
print("Loading Mini-XCEPTION model...")
try:
    model = load_model(MODEL_PATH, compile=False)
    print("✅ Mini-XCEPTION model loaded!")
    print(f"   Model input shape: {model.input_shape}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit(1)

face_cascade = cv2.CascadeClassifier(CASCADE_PATH)
if face_cascade.empty():
    print("❌ Cascade file not found!")
    exit(1)

print("✅ Cascade loaded!")

# ==================== SETUP ====================
emotion_window = deque(maxlen=WINDOW_SIZE)
current_emotion = "Neutral"
last_change_time = 0.0

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    cap = cv2.VideoCapture(1)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam")

print("\n🎭 Webcam started! Real-time emotion detection active.")
print("=" * 50)
print("Express different emotions:")
print("  😊 Smile big → Happy")
print("  😠 Frown, furrow brow → Angry")
print("  😲 Wide eyes, open mouth → Surprise")
print("  😢 Look down, slight frown → Sad")
print("  🤢 Wrinkle nose → Disgust")
print("  😨 Wide eyes, tense → Fear")
print("  😐 Relax completely → Neutral")
print("=" * 50)
print("Press 'q' to quit\n")

# ==================== MAIN LOOP ====================
frame_count = 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    
    frame_count += 1
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray_enhanced = apply_clahe(gray)
    
    faces = face_cascade.detectMultiScale(
        gray_enhanced, 
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(30, 30)
    )
    
    for (x, y, w, h) in faces:
        # Extract and preprocess face
        roi = gray_enhanced[y:y+h, x:x+w]
        
        # ⭐ FIX: Resize to 64x64 for Mini-XCEPTION
        roi_resized = cv2.resize(roi, (64, 64))
        roi_norm = roi_resized.astype("float32") / 255.0
        roi_input = np.expand_dims(roi_norm, axis=(0, -1))
        
        # Predict emotion
        preds = model.predict(roi_input, verbose=0)[0]
        
        # Apply class weights
        preds_weighted = preds.copy()
        for i, emotion in enumerate(EMOTIONS):
            if emotion in CLASS_WEIGHTS:
                preds_weighted[i] *= CLASS_WEIGHTS[emotion]
        
        # Get prediction
        idx = int(np.argmax(preds_weighted))
        label = EMOTIONS[idx]
        conf = float(preds[idx])
        
        # Add to window if confident
        if conf >= CONF_THRESHOLD:
            emotion_window.append(label)
        
        # Stabilize with majority vote
        if len(emotion_window) >= 8:
            emotion_counts = Counter(emotion_window)
            most_common = emotion_counts.most_common(1)[0][0]
            
            now = time.time()
            if current_emotion != most_common:
                if (now - last_change_time) >= COOLDOWN_SECONDS:
                    current_emotion = most_common
                    last_change_time = now
        
        # Draw results
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        cv2.putText(frame, f"{current_emotion}", (x, y-15),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 255, 0), 2)
        
        debug_text = f"{label} ({conf:.2f})"
        cv2.putText(frame, debug_text, (x, y+h+25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 200), 1)
    
    if len(faces) == 0:
        cv2.putText(frame, "No face detected - face camera!", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    
    cv2.imshow("Mini-XCEPTION Emotion Detector - Press Q to Quit", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("\n✅ Program closed!")
print(f"Total frames processed: {frame_count}")
