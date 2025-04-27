# This is a Python script that would use OpenCV for behavior analysis
# Since we're using a simulated approach in Replit, this file is for reference

import cv2
import numpy as np
import sys
import json
import base64
import time


def detect_face(face_cascade, frame):
    """Detect faces in frame using Haar cascade classifier"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )
    return faces, gray

def detect_eyes(eye_cascade, gray, face):
    """Detect eyes in a face region"""
    roi_gray = gray[face[1]:face[1]+face[3], face[0]:face[0]+face[2]]
    eyes = eye_cascade.detectMultiScale(
        roi_gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(20, 20)
    )
    return eyes

def analyze_behavior(image_data):
    """
    Analyze behavior from base64 encoded image
    Returns one of: "working", "idle", "sleeping", "moving"
    """
    # Decode base64 image
    image_bytes = base64.b64decode(image_data)
    np_array = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    
    # Load Haar cascade classifiers
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
    
    # Detect faces
    faces, gray = detect_face(face_cascade, frame)
    
    if len(faces) == 0:
        # No face detected - person is away
        return "idle"
    
    # For simplicity, just analyze the first face
    face = faces[0]
    
    # Detect eyes
    eyes = detect_eyes(eye_cascade, gray, face)
    
    if len(eyes) < 2:
        # Eyes not clearly visible - might be sleeping
        return "sleeping"
    
    # In a real implementation, we would track face movement over time
    # and analyze working vs. moving states
    # For now, just return "working" as default when face & eyes are detected
    return "working"

def main():
    """
    Main function to process command line args
    Expected input: base64 encoded image data
    Output: JSON with status field
    """
    # In a real implementation, we would read the image from stdin or a file
    # and respond with the analysis
    
    image_data = sys.argv[1] if len(sys.argv) > 1 else ""
    
    if not image_data:
        print(json.dumps({"status": "error", "message": "No image data provided"}))
        return
    
    try:
        behavior = analyze_behavior(image_data)
        print(json.dumps({"status": behavior}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    main()
