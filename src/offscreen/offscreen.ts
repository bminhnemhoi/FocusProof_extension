/**
 * FocusProof – Offscreen Document
 * Camera stream + MediaPipe BlazeFace (WASM local).
 * Chỉ phát hiện sự hiện diện khuôn mặt (boolean + confidence), KHÔNG lưu ảnh.
 *
 * Offscreen Document là cách duy nhất để truy cập camera/DOM trong MV3
 * vì Service Worker không có DOM access.
 *
 * Luồng:
 * 1. Background gửi CREATE_OFFSCREEN → init camera + MediaPipe
 * 2. Khi xong → gửi OFFSCREEN_READY về Background
 * 3. Background gửi GET_FACE mỗi 6s → trả về FaceResult
 * 4. STOP_SESSION hoặc DESTROY_OFFSCREEN → cleanup
 */

import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import type { ChromeMessage, FaceResult } from '@/utils/types';

// ============================================================
// State
// ============================================================

let faceDetector: FaceDetector | null = null;
let mediaStream: MediaStream | null = null;
let videoElement: HTMLVideoElement | null = null;
let isReady = false;

// ============================================================
// Camera + MediaPipe Initialization
// ============================================================

async function initCamera(): Promise<{ success: boolean; error?: string }> {
  try {
    videoElement = document.getElementById('camera-feed') as HTMLVideoElement;
    if (!videoElement) {
      console.error('[Offscreen] Video element not found');
      return { success: false, error: 'NO_VIDEO_ELEMENT' };
    }

    // Check permission status first (for debugging)
    try {
      const permStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.warn('[Offscreen] Camera permission status:', permStatus.state);
    } catch {
      // permissions.query may not support 'camera' in all contexts
    }

    // Request camera — permission should already be granted from popup
    console.warn('[Offscreen] Calling getUserMedia...');
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: 'user' },
      audio: false,
    });
    console.warn('[Offscreen] getUserMedia succeeded, tracks:', mediaStream.getTracks().length);
    videoElement.srcObject = mediaStream;
    await videoElement.play();

    // Initialize MediaPipe FaceDetector
    // WASM files served từ public/wasm/ qua chrome-extension URL
    const wasmPath = chrome.runtime.getURL('public/wasm');
    const vision = await FilesetResolver.forVisionTasks(wasmPath);

    const modelPath = chrome.runtime.getURL(
      'public/models/blaze_face_short_range.tflite',
    );

    // Try GPU first, fallback to CPU if WebGL unavailable
    try {
      faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
      });
    } catch (gpuErr) {
      console.warn('[Offscreen] GPU delegate failed, falling back to CPU:', gpuErr);
      faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
      });
    }

    isReady = true;
    console.warn('[Offscreen] Camera + MediaPipe ready');
    return { success: true };
  } catch (err) {
    // Classify error for the manager to decide retry strategy
    const errName = err instanceof DOMException ? err.name : '';
    const message = err instanceof DOMException
      ? `${err.name}: ${err.message}`
      : err instanceof Error ? err.message : String(err);
    console.error('[Offscreen] Init failed:', message);

    // Cleanup partial resources
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }

    // Return specific error type so manager can skip retries for permanent failures
    if (errName === 'NotAllowedError' || errName === 'NotFoundError') {
      return { success: false, error: errName };
    }
    return { success: false, error: 'UNKNOWN' };
  }
}

/**
 * Detect face trên frame hiện tại.
 * Chỉ trả về boolean detected + confidence, KHÔNG lưu ảnh.
 */
function detectFace(): FaceResult {
  if (!isReady || !faceDetector || !videoElement) {
    return { detected: false, confidence: 0 };
  }

  try {
    // Video phải đang play và có kích thước
    if (videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return { detected: false, confidence: 0 };
    }

    const result = faceDetector.detect(videoElement);

    if (result.detections.length > 0) {
      // Lấy detection đầu tiên (khuôn mặt gần nhất)
      const detection = result.detections[0];
      const confidence = detection.categories?.[0]?.score ?? 0;
      return { detected: true, confidence };
    }

    return { detected: false, confidence: 0 };
  } catch (err) {
    console.error('[Offscreen] Detection error:', err);
    return { detected: false, confidence: 0 };
  }
}

/**
 * Cleanup toàn bộ resources.
 */
function cleanup() {
  isReady = false;

  // Stop camera tracks
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  // Clear video
  if (videoElement) {
    videoElement.srcObject = null;
  }

  // Close MediaPipe detector
  if (faceDetector) {
    faceDetector.close();
    faceDetector = null;
  }

  console.warn('[Offscreen] Cleaned up');
}

// ============================================================
// Message Listener
// ============================================================

chrome.runtime.onMessage.addListener(
  (message: ChromeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'CREATE_OFFSCREEN':
        // If already initialized, just respond success
        if (isReady) {
          sendResponse({ success: true });
          return false;
        }
        initCamera().then((result) => {
          if (result.success) {
            chrome.runtime.sendMessage({
              type: 'OFFSCREEN_READY',
              payload: null,
            });
          }
          sendResponse(result); // { success, error? }
        });
        return true; // async

      case 'GET_FACE':
        // Background poll face result mỗi sampling cycle
        sendResponse(detectFace());
        return false;

      case 'STOP_SESSION':
      case 'DESTROY_OFFSCREEN':
        cleanup();
        sendResponse({ success: true });
        return false;

      default:
        return false;
    }
  },
);

console.warn('[FocusProof] Offscreen document loaded');
