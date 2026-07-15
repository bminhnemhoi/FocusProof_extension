/**
 * FocusProof – Core Types & Constants
 * Định nghĩa tất cả types, interfaces và constants cho dự án.
 * Reference: y_tuong.md Section 2.1
 */

// ============================================================
// Session Modes & Goal Configuration
// ============================================================

/** Các chế độ phiên làm việc */
export type SessionMode = 'study' | 'work' | 'programming' | 'video-lecture';

/** Cấu hình đánh giá mục tiêu */
export interface GoalConfig {
  mode: SessionMode;
  customAllowedDomains: string[];
  customExternalRule?: boolean | null;
}

/** Bảng quy tắc domain mặc định theo loại mục tiêu */
export const DEFAULT_GOAL_DOMAIN_RULES: Record<SessionMode, string[]> = {
  'study': ['docs.google.com', 'drive.google.com', 'notion.so', 'evernote.com'],
  'work': ['docs.google.com', 'drive.google.com', 'notion.so'],
  'programming': ['github.com', 'gitlab.com', 'localhost', 'vscode.dev', 'stackblitz.com'],
  'video-lecture': ['youtube.com', 'coursera.org', 'udemy.com', 'zoom.us'],
};

/** Quy tắc mặc định cho ứng dụng ngoài Chrome */
export const DEFAULT_GOAL_EXTERNAL_APP_RULE: Record<SessionMode, boolean> = {
  'study': true,
  'work': true,
  'programming': false,
  'video-lecture': false,
};

// ============================================================
// Session & Sample Types
// ============================================================

/** Trạng thái phiên */
export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';

/** Cấu hình khởi tạo phiên */
export interface SessionConfig {
  taskName: string;
  mode: SessionMode;
  allowedDomains: string[];
  allowExternalApps: boolean;
  strictMode: boolean; // Chỉ cho phép 1 tab duy nhất
  durationMinutes: number;
  cameraEnabled: boolean;
  /**
   * Opt-in cho phép thu 500 ký tự gõ cuối để gửi AI phân tích ngữ cảnh.
   * Mặc định (undefined/false) KHÔNG thu — yêu cầu user-data policy của
   * Chrome Web Store: thu nội dung trang phải có consent rõ ràng.
   */
  captureTypedContent?: boolean;
}

/** Metadata phiên hoàn chỉnh */
export interface SessionData {
  id: string;
  config: SessionConfig;
  status: SessionStatus;
  startTime: number; // timestamp ms
  endTime?: number;
  samples: Sample[];
  /**
   * Lịch sử cảnh báo thực tế phát sinh trong phiên (face-lost, idle,
   * tab-violation, outside-chrome). Được ghi realtime trong sampling loop
   * để thống kê cuối phiên + AI phản ánh đúng số cảnh báo.
   * Optional để tương thích ngược với phiên đã lưu trước bản cập nhật này.
   */
  alerts?: AlertEvent[];
  finalScore?: number;
  hash?: string; // SHA-256 integrity fingerprint (xem certificate.ts)
  badges: string[];
}

/** Một mẫu dữ liệu (mỗi 6 giây) */
export interface Sample {
  timestamp: number;
  face: FaceResult;
  activity: ActivityResult;
  tab: TabResult;
  focusScore: number; // 0–1 weighted score cho mẫu này
  goalCompliant: boolean;
}

/** Kết quả nhận diện khuôn mặt */
export interface FaceResult {
  detected: boolean;
  confidence: number; // 0–1
}

/** Kết quả theo dõi hoạt động */
export interface ActivityResult {
  keystrokes: number;
  clicks: number;
  scrolls: number;
  idle: boolean; // true nếu không hoạt động > 25s
}

/** Kết quả theo dõi tab/screen */
export interface TabResult {
  currentUrl: string; // URL hiện tại hoặc '__outside_chrome__'
  currentDomain: string;
  isAllowed: boolean; // domain nằm trong danh sách cho phép
  isOutsideChrome: boolean;
}

// ============================================================
// Alert Types
// ============================================================

export type AlertType = 'face-lost' | 'idle' | 'tab-violation' | 'outside-chrome';

export interface AlertEvent {
  type: AlertType;
  timestamp: number;
  message: string;
}

// ============================================================
// Gamification
// ============================================================

/** Định nghĩa huy hiệu – kiểm tra cuối session trong finalizeSession() */
export interface BadgeDefinition {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  check: (session: SessionData) => boolean;
}

// ============================================================
// Message Types (Chrome Runtime Messaging)
// ============================================================

export type MessageType =
  | 'START_SESSION'
  | 'STOP_SESSION'
  | 'SESSION_STATUS'
  | 'SESSION_RESULT'
  | 'CLEAR_LAST_RESULT'
  | 'CAMERA_STATUS'
  | 'FACE_RESULT'
  | 'ACTIVITY_DATA'
  | 'GET_ACTIVITY'
  | 'ALERT'
  | 'OFFSCREEN_READY'
  | 'CREATE_OFFSCREEN'
  | 'DESTROY_OFFSCREEN'
  | 'GET_FACE'
  | 'WIDGET_UPDATE'
  | 'TAB_STATE'
  | 'PING'
  | 'BROADCAST_TO_WEB'
  | 'SET_USER';

export interface ChromeMessage<T = unknown> {
  type: MessageType;
  payload: T;
}

// ============================================================
// Storage Keys
// ============================================================

export interface StorageSchema {
  currentSession: SessionData | null;
  sessionHistory: SessionData[];
  settings: UserSettings;
  allowedDomains: string[];
  badges: Record<string, boolean>;
}

export interface UserSettings {
  defaultMode: SessionMode;
  defaultDuration: number; // minutes
  aiOptIn: boolean;
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultMode: 'study',
  defaultDuration: 25,
  aiOptIn: false,
  theme: 'system',
};

// ============================================================
// AI Analysis Types
// ============================================================

export interface AIAnalysisInput {
  sessionMeta: {
    taskName: string;
    mode: SessionMode;
    duration: number;
    totalSamples: number;
    finalScore: number;
    cameraEnabled: boolean;
  };
  sampleSummary: {
    avgFaceConfidence: number;
    avgActivity: number;
    tabComplianceRate: number;
    alertCount: number;
    topDomains: Array<{ domain: string; count: number; durationSeconds: number }>;
  };
  typedContent?: string; // 500 ký tự cuối
  voiceNoteText?: string;
}

export interface AIAnalysisResult {
  summaryVi: string;
  summaryEn: string;
  recommendations: string[];
  focusPattern: string;
}

// ============================================================
// PDF / Certificate Types
// ============================================================

export interface CertificateData {
  session: SessionData;
  aiAnalysis?: AIAnalysisResult;
  qrDataUrl: string;
  generatedAt: number;
}

// ============================================================
// Focus Score Weights
// ============================================================

/** Trọng số khi có camera */
export const WEIGHTS_CAMERA_ON = {
  face: 0.4,
  activity: 0.35,
  tab: 0.25,
} as const;

/** Trọng số khi không có camera */
export const WEIGHTS_CAMERA_OFF = {
  activity: 0.6,
  tab: 0.4,
} as const;

// ============================================================
// Constants
// ============================================================

/** Khoảng thời gian sampling (ms) */
export const SAMPLING_INTERVAL_MS = 6000;

/** Thời gian mất mặt trước khi cảnh báo (ms) */
export const FACE_LOST_THRESHOLD_MS = 8000;

/** Thời gian idle trước khi cảnh báo (ms) */
export const IDLE_THRESHOLD_MS = 25000;

/** Marker cho trạng thái ngoài Chrome */
export const OUTSIDE_CHROME_MARKER = '__outside_chrome__';

/** Thời gian tối đa voice note (giây) */
export const VOICE_NOTE_MAX_SECONDS = 30;

/** Số ký tự cuối cùng gửi cho AI */
export const TYPED_CONTENT_MAX_CHARS = 500;
