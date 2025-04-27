import { BehaviorStatusType } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { API_BASE_URL } from "../config";
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Variables to store the loaded models
let faceModel: faceLandmarksDetection.FaceLandmarksDetector | null = null;
let poseModel: poseDetection.PoseDetector | null = null;

// Interface for webcam initialization
interface WebcamOptions {
  width?: number;
  height?: number;
  facingMode?: string;
}

// Interface for behavior analysis response
interface BehaviorAnalysisResponse {
  status: BehaviorStatusType;
}

// Interface for local behavior detection results
interface LocalBehaviorResult {
  status: BehaviorStatusType;
  confidence: number;
}

/**
 * Initialize TensorFlow models for improved behavior detection
 * This loads the models once and keeps them in memory
 */
export async function initializeAIModels(): Promise<void> {
  try {
    // Only load if not already loaded
    if (!faceModel) {
      console.log('Loading TensorFlow.js face model...');
      await tf.ready();
      
      // Load the face landmarks detection model
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs', // or 'mediapipe' for higher accuracy but slower
        maxFaces: 1, // We only need to detect one face
        refineLandmarks: true, // For more accurate eye and mouth detection
      } as faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig;
      
      faceModel = await faceLandmarksDetection.createDetector(model, detectorConfig);
      console.log('Face model loaded successfully');
    }
    
    // Load pose detection model
    if (!poseModel) {
      console.log('Loading TensorFlow.js pose model...');
      const model = poseDetection.SupportedModels.MoveNet;
      const modelConfig = {
        modelType: 'singlepose', // We only need to detect a single person
        enableSmoothing: true,
        minPoseScore: 0.2
      };
      
      poseModel = await poseDetection.createDetector(model, modelConfig);
      console.log('Pose model loaded successfully');
    }
  } catch (error) {
    console.error('Error initializing AI models:', error);
    // Don't throw here to allow the app to continue working with server-side analysis
  }
}

/**
 * Initialize webcam stream
 * @param videoElement - Video element to attach the stream to
 * @param options - Webcam configuration options
 * @returns Promise resolving to the media stream
 */
export async function initializeWebcam(
  videoElement: HTMLVideoElement, 
  options: WebcamOptions = {}
): Promise<MediaStream> {
  const constraints = {
    video: {
      width: options.width || 640,
      height: options.height || 480,
      facingMode: options.facingMode || "user"
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    
    // Initialize AI models in the background
    initializeAIModels().catch(err => console.warn('AI initialization in background failed:', err));
    
    return stream;
  } catch (error) {
    console.error("Error accessing webcam:", error);
    throw new Error("Unable to access webcam. Please check permissions.");
  }
}

/**
 * Stop webcam stream
 * @param stream - The media stream to stop
 */
export function stopWebcam(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

/**
 * Capture a frame from the webcam
 * @param videoElement - The video element to capture from
 * @returns Base64 encoded image data
 */
export function captureWebcamFrame(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8).split(",")[1]; // Return base64 data without the prefix
}

/**
 * Perform local behavior analysis using TensorFlow.js models
 * @param videoElement - Video element containing the webcam stream
 * @returns Promise resolving to a behavior status and confidence score
 */
export async function localBehaviorAnalysis(
  videoElement: HTMLVideoElement
): Promise<LocalBehaviorResult | null> {
  try {
    // Ensure models are initialized
    if (!faceModel || !poseModel) {
      await initializeAIModels();
      
      // If models still not initialized, can't perform local analysis
      if (!faceModel || !poseModel) {
        return null;
      }
    }
    
    // Run face detection
    const faces = await faceModel.estimateFaces(videoElement);
    
    // Analyze face detection results
    if (faces.length === 0) {
      // No face detected - user might be away
      return { status: 'inactive', confidence: 0.8 };
    }
    
    // Get the first face
    const face = faces[0];
    
    // Check for eye state to detect sleeping
    // MediaPipe provides detailed face landmarks including eyes
    // @ts-ignore - TypeScript doesn't fully recognize the return type
    const leftEyeUpper = face.keypoints.filter(p => p.name?.includes('leftEyeUpper'));
    // @ts-ignore
    const leftEyeLower = face.keypoints.filter(p => p.name?.includes('leftEyeLower'));
    // @ts-ignore
    const rightEyeUpper = face.keypoints.filter(p => p.name?.includes('rightEyeUpper'));
    // @ts-ignore
    const rightEyeLower = face.keypoints.filter(p => p.name?.includes('rightEyeLower'));
    
    // If we have eye landmarks, check if eyes are closed
    if (leftEyeUpper.length > 0 && leftEyeLower.length > 0 && 
        rightEyeUpper.length > 0 && rightEyeLower.length > 0) {
      
      // Use arrow function instead of function declaration
      const getAveragePoints = (points: any[]) => {
        return points.reduce((acc, p) => ({x: acc.x + p.x, y: acc.y + p.y}), {x: 0, y: 0});
      };
      
      const leftEyeUpperAvg = getAveragePoints(leftEyeUpper);
      leftEyeUpperAvg.x /= leftEyeUpper.length;
      leftEyeUpperAvg.y /= leftEyeUpper.length;
      
      const leftEyeLowerAvg = getAveragePoints(leftEyeLower);
      leftEyeLowerAvg.x /= leftEyeLower.length;
      leftEyeLowerAvg.y /= leftEyeLower.length;
      
      const rightEyeUpperAvg = getAveragePoints(rightEyeUpper);
      rightEyeUpperAvg.x /= rightEyeUpper.length;
      rightEyeUpperAvg.y /= rightEyeUpper.length;
      
      const rightEyeLowerAvg = getAveragePoints(rightEyeLower);
      rightEyeLowerAvg.x /= rightEyeLower.length;
      rightEyeLowerAvg.y /= rightEyeLower.length;
      
      // Calculate eye opening ratios
      const leftEyeOpenness = Math.abs(leftEyeUpperAvg.y - leftEyeLowerAvg.y);
      const rightEyeOpenness = Math.abs(rightEyeUpperAvg.y - rightEyeLowerAvg.y);
      const averageEyeOpenness = (leftEyeOpenness + rightEyeOpenness) / 2;
      
      // Threshold for closed eyes
      // This value needs to be adjusted based on testing
      const closedEyeThreshold = 0.02; // Relative to face size
      
      if (averageEyeOpenness < closedEyeThreshold) {
        return { status: 'sleeping', confidence: 0.85 };
      }
    }
    
    // Run pose detection to check for significant movement
    const poses = await poseModel.estimatePoses(videoElement);
    
    // Store historical pose data for movement detection
    // Use a global variable for pose history
    // @ts-ignore - Add to window object for persistent state
    if (!window._poseHistory) {
      // @ts-ignore
      window._poseHistory = [];
    }
    
    if (poses.length > 0) {
      const currentPose = poses[0];
      
      // Add to history (keep last 10 frames)
      // @ts-ignore
      window._poseHistory.push(currentPose);
      // @ts-ignore
      if (window._poseHistory.length > 10) {
        // @ts-ignore
        window._poseHistory.shift();
      }
      
      // Check for movement if we have enough history
      // @ts-ignore
      if (window._poseHistory.length >= 5) {
        // @ts-ignore
        const firstPose = window._poseHistory[0];
        // @ts-ignore
        const lastPose = window._poseHistory[window._poseHistory.length - 1];
        
        // Calculate how much key points have moved
        let totalMovement = 0;
        let pointCount = 0;
        
        if (firstPose.keypoints && lastPose.keypoints) {
          for (let i = 0; i < Math.min(firstPose.keypoints.length, lastPose.keypoints.length); i++) {
            const first = firstPose.keypoints[i];
            const last = lastPose.keypoints[i];
            
            // Only use points with reasonable confidence
            if (first.score > 0.5 && last.score > 0.5) {
              const dx = last.x - first.x;
              const dy = last.y - first.y;
              const distance = Math.sqrt(dx*dx + dy*dy);
              totalMovement += distance;
              pointCount++;
            }
          }
        }
        
        // If we have valid points, check average movement
        if (pointCount > 0) {
          const averageMovement = totalMovement / pointCount;
          
          // Threshold for significant movement
          const movementThreshold = 5.0; // Adjust based on testing
          
          if (averageMovement > movementThreshold) {
            return { status: 'moving', confidence: 0.8 };
          }
        }
      }
    }
    
    // Check for idle state (minimal movement but awake)
    // @ts-ignore
    if (window._poseHistory && window._poseHistory.length >= 5) {
      // Similar to above, but with a smaller threshold
      // @ts-ignore
      const firstPose = window._poseHistory[0];
      // @ts-ignore
      const lastPose = window._poseHistory[window._poseHistory.length - 1];
      
      let totalMovement = 0;
      let pointCount = 0;
      
      if (firstPose.keypoints && lastPose.keypoints) {
        for (let i = 0; i < Math.min(firstPose.keypoints.length, lastPose.keypoints.length); i++) {
          const first = firstPose.keypoints[i];
          const last = lastPose.keypoints[i];
          
          if (first.score > 0.5 && last.score > 0.5) {
            const dx = last.x - first.x;
            const dy = last.y - first.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            totalMovement += distance;
            pointCount++;
          }
        }
      }
      
      if (pointCount > 0) {
        const averageMovement = totalMovement / pointCount;
        const idleThreshold = 2.0; // Very little movement
        
        if (averageMovement < idleThreshold) {
          return { status: 'idle', confidence: 0.7 };
        }
      }
    }
    
    // Default to working if we detect a face but no other specific states
    return { status: 'working', confidence: 0.6 };
    
  } catch (error) {
    console.error("Error in local behavior analysis:", error);
    return null;
  }
}

// Store historical data to improve detection accuracy
interface HistoricalBehavior {
  timestamp: number;
  status: BehaviorStatusType;
  confidence: number;
}

// Keep a history of recent behavior detections to improve accuracy
const behaviorHistory: Record<number, HistoricalBehavior[]> = {};
const HISTORY_LENGTH = 10; // Number of historical detections to keep

/**
 * Analyze behavior from webcam frame with enhanced accuracy
 * Uses temporal filtering to reduce false positives and improve consistency
 * @param imageData - Base64 encoded image data
 * @param employeeId - ID of the employee
 * @param videoElement - Optional video element for local processing
 * @returns Promise resolving to the detected behavior
 */
export async function analyzeBehavior(
  imageData: string,
  employeeId: number,
  videoElement?: HTMLVideoElement
): Promise<BehaviorStatusType> {
  try {
    // Initialize history if needed
    if (!behaviorHistory[employeeId]) {
      behaviorHistory[employeeId] = [];
    }
    
    // Try local analysis first if video element is provided
    let detectedStatus: BehaviorStatusType = "inactive";
    let confidence = 0;
    
    if (videoElement) {
      const localResult = await localBehaviorAnalysis(videoElement);
      
      // If we got a local result, use it
      if (localResult) {
        console.log(`Local behavior analysis: ${localResult.status} (${localResult.confidence.toFixed(2)})`);
        detectedStatus = localResult.status;
        confidence = localResult.confidence;
      }
    }
    
    // If local analysis wasn't confident enough, fall back to server analysis
    if (confidence < 0.7) {
      try {
        const response = await apiRequest("POST", "/api/analyze-behavior", {
          imageData,
          employeeId
        });
        
        const result = await response.json() as BehaviorAnalysisResponse;
        detectedStatus = result.status;
        confidence = 0.8; // Assume server response has good confidence
      } catch (serverError) {
        console.warn("Server behavior analysis failed, using local result", serverError);
        // Keep using the local result if server fails
      }
    }
    
    // Add detection to history
    behaviorHistory[employeeId].push({
      timestamp: Date.now(),
      status: detectedStatus,
      confidence
    });
    
    // Keep history at specified length
    if (behaviorHistory[employeeId].length > HISTORY_LENGTH) {
      behaviorHistory[employeeId].shift();
    }
    
    // Apply temporal filtering to reduce oscillations and improve consistency
    const finalStatus = applyTemporalFiltering(behaviorHistory[employeeId]);
    return finalStatus;
  } catch (error) {
    console.error("Error analyzing behavior:", error);
    throw new Error("Failed to analyze behavior");
  }
}

/**
 * Apply temporal filtering to improve detection stability
 * Prevents rapid oscillations between states and gives more weight to recent detections
 * @param history - Array of historical behavior detections
 * @returns The most likely current behavior status
 */
function applyTemporalFiltering(history: HistoricalBehavior[]): BehaviorStatusType {
  if (history.length === 0) return "inactive";
  
  // Only use recent history (last 5 seconds)
  const recentHistory = history.filter(h => Date.now() - h.timestamp < 5000);
  if (recentHistory.length === 0) return history[history.length - 1].status;
  
  // Count weighted occurrences of each status
  const statusCounts: Record<BehaviorStatusType, number> = {
    working: 0,
    idle: 0,
    sleeping: 0,
    moving: 0,
    inactive: 0
  };
  
  // More recent detections and higher confidence ones get more weight
  recentHistory.forEach((detection, index) => {
    // Recency weight: newer detections matter more
    const recencyWeight = (index + 1) / recentHistory.length;
    // Confidence weight: more confident detections matter more
    const weight = detection.confidence * recencyWeight;
    
    statusCounts[detection.status] += weight;
  });
  
  // Return the status with the highest weighted count
  let maxCount = 0;
  let maxStatus: BehaviorStatusType = "inactive";
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxStatus = status as BehaviorStatusType;
    }
  });
  
  // Special case: idle -> sleeping transition
  // If we've been idle for a while and now detect sleeping, require more evidence
  if (maxStatus === "sleeping" && statusCounts.sleeping < statusCounts.idle * 1.5) {
    const sleepingCount = recentHistory.filter(h => h.status === "sleeping").length;
    const idleCount = recentHistory.filter(h => h.status === "idle").length;
    
    // Need at least 2 consecutive sleeping detections to transition from idle
    if (sleepingCount < 2 && idleCount > 0) {
      return "idle" as BehaviorStatusType;
    }
  }
  
  return maxStatus;
}
