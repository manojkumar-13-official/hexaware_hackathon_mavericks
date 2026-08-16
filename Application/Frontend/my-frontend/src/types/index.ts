// ============================================================
// CORE ENTITY TYPES
// GovConnect - AI-Powered Citizen Call Intelligence Platform
// ============================================================

// ----------------------------------------------------------
// USER & AUTH TYPES
// ----------------------------------------------------------

export type UserRole = 'citizen' | 'call_center' | 'officer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  badge?: string; // officer badge number
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthTokens {
  // BACKEND_HOOK: JWT access + refresh token pair from Spring Boot /auth/login
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ----------------------------------------------------------
// COMPLAINT / GRIEVANCE TYPES
// ----------------------------------------------------------

export type ComplaintStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'pending_info'
  | 'escalated'
  | 'resolved'
  | 'closed'
  | 'rejected';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintCategory =
  | 'water_supply'
  | 'electricity'
  | 'roads'
  | 'sanitation'
  | 'public_safety'
  | 'noise'
  | 'encroachment'
  | 'taxation'
  | 'education'
  | 'healthcare'
  | 'other';

export interface ComplaintAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number; // bytes
  url: string;
  uploadedAt: string;
}

export interface ComplaintTimeline {
  id: string;
  status: ComplaintStatus;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Complaint {
  id: string;
  referenceNumber: string; // e.g. GRV-2024-00123
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  subCategory?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  department: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  location: {
    address: string;
    ward?: string;
    district: string;
    pincode?: string;
    coordinates?: { lat: number; lng: number };
  };
  attachments: ComplaintAttachment[];
  timeline: ComplaintTimeline[];
  aiInsights?: AIInsights;
  callId?: string; // linked call if complaint was via phone
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  dueDate?: string;
  satisfactionRating?: number; // 1-5
  feedbackNote?: string;
}

// ----------------------------------------------------------
// CALL / TELEPHONY TYPES
// ----------------------------------------------------------

export type CallStatus = 'queued' | 'ringing' | 'active' | 'on_hold' | 'completed' | 'missed' | 'transferred';

export type CallDirection = 'inbound' | 'outbound';

export interface Call {
  id: string;
  callSid: string; // BACKEND_HOOK: Twilio/IVR call SID
  citizenPhone: string;
  citizenName?: string;
  agentId: string;
  agentName: string;
  direction: CallDirection;
  status: CallStatus;
  duration?: number; // seconds
  waitTime?: number; // seconds in queue
  startedAt: string;
  endedAt?: string;
  recordingUrl?: string; // BACKEND_HOOK: call recording storage URL
  complaintId?: string;
  transcript?: Transcript;
  aiInsights?: AIInsights;
  language?: string;
  ivr_path?: string[]; // IVR menu selections
}

// ----------------------------------------------------------
// TRANSCRIPT TYPES
// ----------------------------------------------------------

export type SpeakerRole = 'citizen' | 'agent' | 'system';

export interface TranscriptSegment {
  id: string;
  speaker: SpeakerRole;
  speakerName: string;
  text: string;
  startTime: number; // seconds from call start
  endTime: number;
  confidence: number; // 0-1, ASR confidence
  language?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  // WEBSOCKET_HOOK: isLive flag set to true for streaming segments
  isLive?: boolean;
}

export interface Transcript {
  id: string;
  callId: string;
  segments: TranscriptSegment[];
  language: string;
  totalDuration: number;
  // WEBSOCKET_HOOK: isStreaming true when call is active and transcript is live
  isStreaming?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------
// AI INSIGHTS TYPES
// ----------------------------------------------------------

export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'frustrated' | 'urgent' | 'fearful';

export interface Entity {
  text: string;
  type: 'location' | 'date' | 'person' | 'organization' | 'issue' | 'amount';
  confidence: number;
}

export interface SuggestedAction {
  id: string;
  action: string;
  department: string;
  priority: ComplaintPriority;
  estimatedResolutionDays: number;
  confidence: number;
}

export interface AIInsights {
  id: string;
  sourceId: string; // callId or complaintId
  sourceType: 'call' | 'complaint';
  // AI_HOOK: Sentiment analysis from NLP microservice
  sentiment: SentimentLabel;
  sentimentScore: number; // -1 to 1
  // AI_HOOK: Topic classification
  detectedTopics: string[];
  // AI_HOOK: Named entity recognition
  entities: Entity[];
  // AI_HOOK: Auto-generated complaint summary
  summary: string;
  // AI_HOOK: Suggested routing and actions
  suggestedActions: SuggestedAction[];
  // AI_HOOK: Urgency score 0-100
  urgencyScore: number;
  // AI_HOOK: Category prediction
  predictedCategory?: ComplaintCategory;
  predictedDepartment?: string;
  // AI_HOOK: Language detection
  detectedLanguage?: string;
  modelVersion: string;
  processedAt: string;
}

export interface VoicePipelineOutput {
  detected_language: string;
  language_name: string;
  original_transcript: string;
  translated_text: string;
  title: string;
  summary: string;
  important_keywords: string[];
  category: ComplaintCategory;
  sub_category?: string;
  severity_score: number;
  severity_rationale: string;
  is_emergency: boolean;
  priority: ComplaintPriority;
  sentiment: SentimentLabel;
  urgency_score: number;
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  risk_breakdown?: {
    safety_risk: number;
    population_impact: number;
    duration_factor: number;
    vulnerability: number;
    summary: string;
  };
  resolution_plan?: {
    field_squad: string;
    required_equipment: string[];
    resolution_steps: string[];
    estimated_cost_tier: 'Low (<₹5k)' | 'Medium (₹5k–₹25k)' | 'High (>₹25k)';
    target_completion: string;
  };
  recommended_department: string;
  department_code: string;
  department_full_name: string;
  department_routing_rationale?: string;
  sla_hours: number;
  entities: {
    locations: string[];
    ward?: string | null;
    district?: string | null;
    people_affected?: number | null;
    duration_mentioned?: string | null;
  };
  suggested_actions: {
    action: string;
    priority: string;
    estimated_days: number;
  }[];
  confidence: number;
  processing_ms?: number;
  mode?: string;
}

// ----------------------------------------------------------
// NOTIFICATION TYPES
// ----------------------------------------------------------

export type NotificationType =
  | 'complaint_update'
  | 'new_assignment'
  | 'escalation'
  | 'message'
  | 'system'
  | 'sla_breach';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ----------------------------------------------------------
// DEPARTMENT / OFFICER TYPES
// ----------------------------------------------------------

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfficerId?: string;
  contactEmail?: string;
  contactPhone?: string;
  slaHours: number; // SLA target in hours
  isActive: boolean;
}

export interface OfficerStats {
  officerId: string;
  totalAssigned: number;
  resolved: number;
  pending: number;
  escalated: number;
  avgResolutionDays: number;
  satisfactionAvg: number;
}

// ----------------------------------------------------------
// ANALYTICS TYPES
// ----------------------------------------------------------

export interface DepartmentStat {
  department: string;
  total: number;
  resolved: number;
  pending: number;
  escalated: number;
}

export interface TrendDataPoint {
  date: string;
  submitted: number;
  resolved: number;
  escalated: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface AnalyticsSummary {
  totalComplaints: number;
  resolvedToday: number;
  pendingEscalations: number;
  avgResolutionHours: number;
  citizenSatisfaction: number;
  activeCalls: number;
  callsToday: number;
  aiProcessedCalls: number;
}

// ----------------------------------------------------------
// PAGINATION & API RESPONSE TYPES
// ----------------------------------------------------------

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  // BACKEND_HOOK: Standard API response envelope from Spring Boot
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
}

// ----------------------------------------------------------
// FILTER & SEARCH TYPES
// ----------------------------------------------------------

export interface ComplaintFilters {
  search?: string;
  status?: ComplaintStatus[];
  priority?: ComplaintPriority[];
  category?: ComplaintCategory[];
  department?: string[];
  dateFrom?: string;
  dateTo?: string;
  assignedOfficerId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CallFilters {
  search?: string;
  status?: CallStatus[];
  direction?: CallDirection;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ----------------------------------------------------------
// FORM TYPES
// ----------------------------------------------------------

export interface NewComplaintForm {
  title: string;
  description: string;
  category: ComplaintCategory;
  subCategory?: string;
  address: string;
  ward?: string;
  district: string;
  pincode?: string;
  attachments?: File[];
}

export interface ProfileUpdateForm {
  name: string;
  phone?: string;
  email: string;
}
