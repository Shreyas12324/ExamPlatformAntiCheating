from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
from typing import Dict
import logging
from datetime import datetime
from ultralytics import YOLO
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Anti-Cheating ML Service",
    description="ML service for detecting cheating behavior via webcam",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
try:
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
    
    try:
        
        import ultralytics.nn.tasks as _ultra_tasks

        
        if hasattr(torch.serialization, 'safe_globals'):
            try:
                with torch.serialization.safe_globals([_ultra_tasks.DetectionModel]):
                    model = YOLO('yolov8n.pt')
            except Exception:
                # If context manager fails for any reason, fall back to add_safe_globals
                if hasattr(torch.serialization, 'add_safe_globals'):
                    torch.serialization.add_safe_globals([_ultra_tasks.DetectionModel])
                    model = YOLO('yolov8n.pt')
                else:
                    model = YOLO('yolov8n.pt')

        # Fallback: older or different torch API provides add_safe_globals
        elif hasattr(torch.serialization, 'add_safe_globals'):
            torch.serialization.add_safe_globals([_ultra_tasks.DetectionModel])
            model = YOLO('yolov8n.pt')

        else:
            # Last resort: load normally (may fail with WeightsUnpickler error)
            model = YOLO('yolov8n.pt')
    except Exception as _e:
        # If allowlisting or model load fails, log a helpful message and re-raise
        logger.warning(f"Could not apply safe_globals/add_safe_globals for ultralytics: {_e}")
        # Attempt a normal load as a final fallback. If this raises, it will be
        # caught by the outer exception handler and the service will mark models as None.
        try:
            model = YOLO('yolov8n.pt')
        except Exception as final_e:
            raise final_e
    logger.info("OpenCV & YOLO models loaded successfully")
except Exception as e:
    logger.error(f"Failed to load models: {e}")
    face_cascade = None
    eye_cascade = None
    model = None


def detect_mobile_device(image: np.ndarray) -> Dict:
    """Detects mobile phones using YOLO model."""
    try:
        if model is None:
            return {"detected": False, "reason": "Model not loaded"}

        results = model(image)
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls[0])
                # class 67 is 'cell phone' in COCO dataset
                if class_id == 67:
                    x1, y1, x2, y2 = box.xyxy[0]
                    return {
                        "detected": True,
                        "bounding_box": [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                        "confidence": float(box.conf[0])
                    }
        
        return {"detected": False}
    except Exception as exc:
        logger.error(f"Mobile detection error: {exc}")
        return {"detected": False}


def analyze_image(image_bytes: bytes) -> Dict:
    """
    Analyze webcam image for cheating indicators:
    - Multiple faces detected
    - No face detected
    - Face position/orientation
    - Eye gaze detection (basic)
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        num_faces = len(faces)
        cheating_score = 0
        severity = "low"
        issues = []

        mobile_detection = detect_mobile_device(img)
        if mobile_detection.get("detected"):
            cheating_score = max(cheating_score, 85)
            severity = "critical"
            issues.append("Possible mobile phone detected in frame")
        
        # Check face count
        if num_faces == 0:
            cheating_score = 70
            severity = "high"
            issues.append("No face detected")
        elif num_faces > 1:
            cheating_score = 90
            severity = "critical"
            issues.append(f"Multiple faces detected ({num_faces})")
        else:
            # Analyze single face
            (x, y, w, h) = faces[0]
            
            # Check face position (should be centered)
            img_height, img_width = img.shape[:2]
            face_center_x = x + w // 2
            face_center_y = y + h // 2
            img_center_x = img_width // 2
            img_center_y = img_height // 2
            
            # Calculate offset from center (normalized)
            offset_x = abs(face_center_x - img_center_x) / img_width
            offset_y = abs(face_center_y - img_center_y) / img_height
            
            if offset_x > 0.3 or offset_y > 0.3:
                cheating_score += 30
                issues.append("Face not centered - possible looking away")
            
            # Check face size (too small = far away, too large = too close)
            face_area_ratio = (w * h) / (img_width * img_height)
            if face_area_ratio < 0.05:
                cheating_score += 25
                issues.append("Face too small - person too far")
            elif face_area_ratio > 0.5:
                cheating_score += 15
                issues.append("Face too close to camera")
            
            # Detect eyes within face region
            roi_gray = gray[y:y+h, x:x+w]
            eyes = eye_cascade.detectMultiScale(roi_gray)
            
            if len(eyes) < 2:
                cheating_score += 5
                issues.append("Eyes not clearly visible - possible gaze away")
            
            # Determine severity based on score
            if severity != "critical":
                if cheating_score >= 60:
                    severity = "high"
                elif cheating_score >= 40:
                    severity = "medium"
                else:
                    severity = "low"
        
        # Build response
        result = {
            "success": True,
            "cheating_score": min(cheating_score, 100),
            "severity": severity,
            "num_faces": int(num_faces),
            "issues": issues,
            "message": " | ".join(issues) if issues else "No significant issues detected",
            "timestamp": datetime.now().isoformat(),
            "analysis": {
                "faces_detected": int(num_faces),
                "optimal_condition": num_faces == 1 and cheating_score < 30,
                "mobile_detection": mobile_detection
            }
        }

        result["mobile_detected"] = mobile_detection.get("detected", False)
        
        return result
        
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Anti-Cheating ML Service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    models_loaded = face_cascade is not None and eye_cascade is not None
    return {
        "status": "healthy" if models_loaded else "degraded",
        "models_loaded": models_loaded,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/ml/check_face")
async def check_face(image: UploadFile = File(...)):
    """
    Analyze webcam image for cheating detection
    
    Parameters:
    - image: Uploaded image file (JPG, PNG, etc.)
    
    Returns:
    - cheating_score: 0-100 score indicating likelihood of cheating
    - severity: low/medium/high/critical
    - num_faces: Number of faces detected
    - issues: List of detected issues
    - message: Summary message
    """
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Check model availability
        if face_cascade is None or eye_cascade is None:
            raise HTTPException(status_code=503, detail="ML models not loaded")
        
        # Read image bytes
        image_bytes = await image.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Analyze image
        result = analyze_image(image_bytes)
        
        logger.info(f"Image analyzed - Score: {result['cheating_score']}, Faces: {result['num_faces']}")
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.post("/ml/check_liveness")
async def check_liveness(image: UploadFile = File(...)):
    """
    Basic liveness detection (placeholder for advanced model)
    
    In production, this would use:
    - Deep learning models for liveness detection
    - Texture analysis
    - Motion detection (video stream)
    - Challenge-response (blink detection)
    """
    try:
        image_bytes = await image.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image")
        
        # Placeholder: Basic checks
        # In production, integrate with proper liveness detection model
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Calculate image variance (blurriness indicator)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        is_live = variance > 100  # Threshold for blur detection
        
        return {
            "success": True,
            "is_live": is_live,
            "confidence": min(variance / 500, 1.0),
            "message": "Live person detected" if is_live else "Possible photo/screen detected",
            "note": "This is a basic implementation. Use advanced models in production."
        }
        
    except Exception as e:
        logger.error(f"Liveness check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
