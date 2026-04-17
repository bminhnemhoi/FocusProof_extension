/**
 * FocusProof – CameraModal Component
 * Modal hướng dẫn camera trước khi bắt đầu phiên.
 * Hiển thị khi cameraEnabled = true, cho phép user skip (→ Camera-Off Mode).
 *
 * QUAN TRỌNG: Modal này pre-request quyền camera trong popup context.
 * Vì popup và offscreen cùng origin (chrome-extension://<id>/),
 * permission grant từ popup sẽ tự động áp dụng cho offscreen document.
 * Điều này đảm bảo offscreen getUserMedia() không bị NotAllowedError.
 *
 * Reference: y_tuong.md Section 6 – User Flow step 2-4
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface CameraModalProps {
  onConfirm: () => void;
  onSkip: () => void;
}

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'not-found' | 'error';

export default function CameraModal({ onConfirm, onSkip }: CameraModalProps) {
  const [step, setStep] = useState<'info' | 'preview'>('info');
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /** Stop camera stream and release resources */
  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  /** Request camera permission and show preview */
  const startPreview = useCallback(async () => {
    setCameraState('requesting');
    setErrorMessage('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState('active');
    } catch (err) {
      const errName = err instanceof DOMException ? err.name : '';
      if (errName === 'NotAllowedError') {
        setCameraState('denied');
        setErrorMessage('Quyền camera bị từ chối. Bạn có thể chạy không camera.');
      } else if (errName === 'NotFoundError') {
        setCameraState('not-found');
        setErrorMessage('Không tìm thấy camera. Hãy kiểm tra thiết bị.');
      } else {
        setCameraState('error');
        setErrorMessage(`Lỗi camera: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopPreview(); };
  }, [stopPreview]);

  /** Move to preview step and start camera */
  function handleContinue() {
    setStep('preview');
    startPreview();
  }

  /** Confirm and start session — stop preview first, offscreen will use same permission */
  function handleConfirm() {
    stopPreview();
    onConfirm();
  }

  /** Skip camera — stop preview and proceed without camera */
  function handleSkip() {
    stopPreview();
    onSkip();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleSkip()}>
      <div className="modal-content">
        <h2 className="modal-title">📷 Chuẩn bị Camera</h2>

        {step === 'info' && (
          <>
            <div className="modal-body">
              <div className="camera-guide">
                <div className="guide-item">
                  <span className="guide-icon">🔒</span>
                  <p>FocusProof <strong>không lưu ảnh/video</strong>. Chỉ phát hiện sự hiện diện khuôn mặt.</p>
                </div>
                <div className="guide-item">
                  <span className="guide-icon">💡</span>
                  <p>Đảm bảo đủ ánh sáng và khuôn mặt hiển thị rõ trong webcam.</p>
                </div>
                <div className="guide-item">
                  <span className="guide-icon">🖥️</span>
                  <p>Bước tiếp theo sẽ xin quyền camera. Hãy bấm <strong>"Cho phép"</strong> khi Chrome hỏi.</p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary btn-full" onClick={handleContinue} type="button">
                Đã hiểu, bật camera
              </button>
              <button className="btn btn-ghost" onClick={handleSkip} type="button">
                Bỏ qua camera (Camera-Off Mode)
              </button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="modal-body">
              {/* Camera preview */}
              <div className="camera-preview-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`camera-preview ${cameraState === 'active' ? 'camera-preview--active' : ''}`}
                />
                {cameraState === 'requesting' && (
                  <div className="camera-preview-overlay">
                    <span className="camera-preview-spinner">⏳</span>
                    <p>Đang xin quyền camera...</p>
                    <p className="camera-preview-hint">Bấm "Cho phép" nếu Chrome hỏi</p>
                  </div>
                )}
                {cameraState === 'active' && (
                  <div className="camera-preview-badge">✅ Camera đang hoạt động</div>
                )}
                {(cameraState === 'denied' || cameraState === 'not-found' || cameraState === 'error') && (
                  <div className="camera-preview-overlay camera-preview-overlay--error">
                    <span className="camera-preview-spinner">❌</span>
                    <p>{errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              {cameraState === 'active' && (
                <button className="btn btn-primary btn-full" onClick={handleConfirm} type="button">
                  🚀 Bắt đầu phiên với Camera
                </button>
              )}
              {cameraState === 'requesting' && (
                <button className="btn btn-primary btn-full" disabled type="button">
                  ⏳ Đang chờ quyền camera...
                </button>
              )}
              {(cameraState === 'denied' || cameraState === 'not-found' || cameraState === 'error') && (
                <>
                  <button className="btn btn-primary btn-full" onClick={handleSkip} type="button">
                    Chạy không camera (Camera-Off)
                  </button>
                  <button className="btn btn-ghost" onClick={startPreview} type="button">
                    🔄 Thử lại
                  </button>
                </>
              )}
              <button className="btn btn-ghost" onClick={handleSkip} type="button">
                Bỏ qua
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
