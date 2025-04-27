import { apiRequest } from "./queryClient";
import { API_BASE_URL } from "../config";

// Variables to store the screen sharing stream and recording
let displayStream: MediaStream | null = null;
let isRecording = false;

/**
 * Request screen sharing permissions and start the stream
 * @returns Promise resolving to screen sharing MediaStream
 */
export async function requestScreenAccess(): Promise<MediaStream> {
  try {
    // Using correct type definition for getDisplayMedia
    const constraints = {
      // @ts-ignore - TypeScript doesn't recognize these options but they're valid for getDisplayMedia
      video: {
        cursor: "always",
        displaySurface: "application", // Focus on application windows only
      }
    };

    // @ts-ignore - TypeScript doesn't recognize getDisplayMedia by default, but it exists in browsers
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    displayStream = stream;
    
    // Add event listener to detect when user stops sharing
    const tracks = stream.getVideoTracks();
    if (tracks.length > 0) {
      tracks[0].addEventListener('ended', () => {
        displayStream = null;
        console.log('User ended screen sharing');
      });
    }
    
    return stream;
  } catch (error) {
    console.error('Error requesting screen access:', error);
    throw new Error('Failed to access screen. Please ensure you grant permission for screen sharing.');
  }
}

/**
 * Stop screen sharing if active
 */
export function stopScreenSharing(): void {
  if (displayStream) {
    displayStream.getTracks().forEach(track => track.stop());
    displayStream = null;
  }
}

/**
 * Check if screen sharing is currently active
 * @returns boolean indicating if screen sharing is active
 */
export function isScreenSharingActive(): boolean {
  return displayStream !== null && displayStream.active && 
         displayStream.getVideoTracks().some(track => track.readyState === 'live');
}

/**
 * Capture a screenshot of the current screen
 * @returns Promise resolving to base64 encoded screenshot data
 */
export async function captureScreenshot(): Promise<string> {
  try {
    // If no screen sharing permission has been granted, request it
    if (!displayStream) {
      try {
        await requestScreenAccess();
      } catch (error) {
        // If user denies permission, fall back to simulated screenshot
        console.warn('Screen access denied, using simulated screenshot');
        return captureSimulatedScreenshot();
      }
    }
    
    // Verify that we have an active stream
    if (!isScreenSharingActive()) {
      return captureSimulatedScreenshot();
    }
    
    // Get the video track from the stream
    // We've already checked that displayStream is active, but add an extra check for TypeScript
    if (!displayStream) {
      return captureSimulatedScreenshot();
    }
    const videoTrack = displayStream.getVideoTracks()[0];
    
    // Create a video element to capture from
    const video = document.createElement('video');
    video.srcObject = new MediaStream([videoTrack]);
    
    // Wait for video to be ready
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
    
    // Create a canvas and draw the video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Draw the current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const screenshotData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    
    // Clean up
    video.pause();
    
    return screenshotData;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    // Fall back to simulated screenshot on error
    return captureSimulatedScreenshot();
  }
}

/**
 * Generate a simulated screenshot when real screen capture is not available
 * @returns Base64 encoded image data
 */
function captureSimulatedScreenshot(): string {
  try {
    // Create a canvas to draw a simulated screenshot
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Draw a simulated screen with a gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f5f7fa');
    gradient.addColorStop(1, '#e4e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some "window" elements
    drawSimulatedWindow(ctx, 50, 50, 400, 300, 'Document');
    drawSimulatedWindow(ctx, 500, 150, 700, 400, 'Application');
    
    // Add a message indicating this is a simulated screenshot
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Please grant screen sharing permission for actual screenshots', 
      canvas.width / 2, 
      canvas.height - 15
    );
    
    // Convert to base64
    const screenshotData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    return screenshotData;
  } catch (error) {
    console.error('Error creating simulated screenshot:', error);
    throw new Error('Failed to create simulated screenshot');
  }
}

/**
 * Helper function to draw a simulated window on the canvas
 */
function drawSimulatedWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
): void {
  // Window border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, width, height);
  
  // Window title bar
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(x, y, width, 30);
  
  // Window border
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Window title
  ctx.fillStyle = '#333333';
  ctx.font = '14px Arial';
  ctx.fillText(title, x + 10, y + 20);
  
  // Window buttons
  ctx.fillStyle = '#ff5f57'; // Close
  ctx.beginPath();
  ctx.arc(x + width - 50, y + 15, 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffbd2e'; // Minimize
  ctx.beginPath();
  ctx.arc(x + width - 70, y + 15, 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#28c940'; // Maximize
  ctx.beginPath();
  ctx.arc(x + width - 90, y + 15, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Window content (random colored boxes)
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2)`;
    ctx.fillRect(
      x + 20 + Math.random() * (width - 100),
      y + 50 + Math.random() * (height - 100),
      80 + Math.random() * 120,
      20 + Math.random() * 40
    );
  }
}

/**
 * Upload a screenshot to the server
 * @param imageData - Base64 encoded screenshot data
 * @param employeeId - ID of the employee
 * @returns Promise resolving to the created screenshot ID
 */
export async function uploadScreenshot(
  imageData: string,
  employeeId: number
): Promise<number> {
  try {
    const response = await apiRequest('POST', '/api/screenshots', {
      employeeId,
      imageData
    });
    
    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    throw new Error('Failed to upload screenshot');
  }
}

// --- REMOVED SCREEN RECORDING FUNCTIONALITY ---
// All screen recording and uploadScreenRecording related code has been removed below.
// --- END REMOVAL ---
