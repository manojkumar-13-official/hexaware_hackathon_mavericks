import type {
  Complaint,
  Call,
  Transcript,
  AIInsights,
  Notification,
  Department,
  AnalyticsSummary,
  DepartmentStat,
  TrendDataPoint,
  CategoryBreakdown,
  SentimentTrend,
  OfficerStats,
} from '@/types'

// ----------------------------------------------------------
// MOCK DATA
// All data below is for MVP / demo. Replace by wiring src/api
// files to your Spring Boot backend.
// ----------------------------------------------------------

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Public Works', code: 'PWD', slaHours: 72, isActive: true, headOfficerId: 'u3', contactEmail: 'pwd@demo.gov.in', contactPhone: '1800-111-001' },
  { id: 'd2', name: 'Water Supply', code: 'WSD', slaHours: 48, isActive: true, contactEmail: 'water@demo.gov.in', contactPhone: '1800-111-002' },
  { id: 'd3', name: 'Electricity Board', code: 'ELEC', slaHours: 24, isActive: true, contactEmail: 'elec@demo.gov.in', contactPhone: '1800-111-003' },
  { id: 'd4', name: 'Sanitation', code: 'SAN', slaHours: 48, isActive: true, contactEmail: 'san@demo.gov.in', contactPhone: '1800-111-004' },
  { id: 'd5', name: 'Public Safety', code: 'PS', slaHours: 12, isActive: true, contactEmail: 'safety@demo.gov.in', contactPhone: '1800-111-005' },
  { id: 'd6', name: 'Revenue', code: 'REV', slaHours: 168, isActive: true, contactEmail: 'rev@demo.gov.in', contactPhone: '1800-111-006' },
]

export const MOCK_AI_INSIGHTS: AIInsights[] = [
  {
    id: 'ai1',
    sourceId: 'c1',
    sourceType: 'complaint',
    sentiment: 'frustrated',
    sentimentScore: -0.72,
    detectedTopics: ['pothole', 'road damage', 'accident risk'],
    entities: [
      { text: 'MG Road', type: 'location', confidence: 0.95 },
      { text: 'Ward 12', type: 'location', confidence: 0.88 },
      { text: '3 months', type: 'date', confidence: 0.82 },
    ],
    summary: 'Citizen reports deep potholes on MG Road near Ward 12 that have persisted for approximately 3 months, posing accident risk to two-wheelers.',
    suggestedActions: [
      { id: 'sa1', action: 'Inspect and patch potholes on MG Road', department: 'Public Works', priority: 'high', estimatedResolutionDays: 5, confidence: 0.91 },
      { id: 'sa2', action: 'Install warning signage immediately', department: 'Public Works', priority: 'high', estimatedResolutionDays: 1, confidence: 0.88 },
    ],
    urgencyScore: 78,
    predictedCategory: 'roads',
    predictedDepartment: 'Public Works',
    detectedLanguage: 'en',
    modelVersion: 'govai-v1.2',
    processedAt: '2024-03-15T10:05:00Z',
  },
  {
    id: 'ai2',
    sourceId: 'c2',
    sourceType: 'complaint',
    sentiment: 'urgent',
    sentimentScore: -0.85,
    detectedTopics: ['water supply', 'contamination', 'health risk'],
    entities: [
      { text: 'Sector 7B', type: 'location', confidence: 0.97 },
      { text: '2 days', type: 'date', confidence: 0.78 },
    ],
    summary: 'Urgent complaint about discolored and foul-smelling water supply in Sector 7B for 2 days. Multiple households affected. Possible pipeline contamination.',
    suggestedActions: [
      { id: 'sa3', action: 'Emergency water quality test in Sector 7B', department: 'Water Supply', priority: 'critical', estimatedResolutionDays: 1, confidence: 0.94 },
      { id: 'sa4', action: 'Provide alternative water supply immediately', department: 'Water Supply', priority: 'critical', estimatedResolutionDays: 1, confidence: 0.92 },
    ],
    urgencyScore: 95,
    predictedCategory: 'water_supply',
    predictedDepartment: 'Water Supply',
    detectedLanguage: 'en',
    modelVersion: 'govai-v1.2',
    processedAt: '2024-03-16T08:30:00Z',
  },
]

export const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: 'c1',
    referenceNumber: 'GRV-2024-00123',
    citizenId: 'u1',
    citizenName: 'Priya Sharma',
    citizenPhone: '+91-9876543210',
    title: 'Deep potholes on MG Road causing accidents',
    description: 'There are several large and deep potholes on MG Road near the intersection with Park Street, Ward 12. Two-wheelers have had accidents. This has been reported before but not fixed for over 3 months.',
    category: 'roads',
    status: 'in_progress',
    priority: 'high',
    department: 'Public Works',
    assignedOfficerId: 'u3',
    assignedOfficerName: 'Anita Desai',
    location: { address: 'MG Road, near Park Street intersection', ward: 'Ward 12', district: 'Central', pincode: '560001' },
    attachments: [{ id: 'att1', fileName: 'pothole_photo.jpg', fileType: 'image/jpeg', fileSize: 204800, url: '/mock/pothole.jpg', uploadedAt: '2024-03-15T10:00:00Z' }],
    timeline: [
      { id: 't1', status: 'submitted', note: 'Complaint submitted by citizen via portal', updatedBy: 'Priya Sharma', updatedAt: '2024-03-15T10:00:00Z' },
      { id: 't2', status: 'acknowledged', note: 'Complaint acknowledged by Call Center', updatedBy: 'Rajan Mehta', updatedAt: '2024-03-15T11:30:00Z' },
      { id: 't3', status: 'in_progress', note: 'Assigned to Officer Anita Desai for inspection', updatedBy: 'Rajan Mehta', updatedAt: '2024-03-16T09:00:00Z' },
    ],
    aiInsights: MOCK_AI_INSIGHTS[0],
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-16T09:00:00Z',
    dueDate: '2024-03-18T23:59:00Z',
  },
  {
    id: 'c2',
    referenceNumber: 'GRV-2024-00124',
    citizenId: 'u1',
    citizenName: 'Priya Sharma',
    citizenPhone: '+91-9876543210',
    title: 'Contaminated water supply — urgent',
    description: 'Water supply in Sector 7B has been discolored and smells foul for 2 days. Multiple households are affected. This is a health emergency.',
    category: 'water_supply',
    status: 'escalated',
    priority: 'critical',
    department: 'Water Supply',
    location: { address: 'Sector 7B, Block C', ward: 'Ward 8', district: 'North', pincode: '560080' },
    attachments: [],
    timeline: [
      { id: 't4', status: 'submitted', note: 'Submitted via phone call', updatedBy: 'Rajan Mehta', updatedAt: '2024-03-16T08:00:00Z' },
      { id: 't5', status: 'escalated', note: 'Escalated due to health risk — critical priority', updatedBy: 'System', updatedAt: '2024-03-16T08:35:00Z' },
    ],
    aiInsights: MOCK_AI_INSIGHTS[1],
    callId: 'call1',
    createdAt: '2024-03-16T08:00:00Z',
    updatedAt: '2024-03-16T08:35:00Z',
    dueDate: '2024-03-17T08:00:00Z',
  },
  {
    id: 'c3',
    referenceNumber: 'GRV-2024-00105',
    citizenId: 'u5',
    citizenName: 'Vikram Nair',
    citizenPhone: '+91-9111222333',
    title: 'Streetlight not working for 2 weeks',
    description: 'The streetlight near 45, Nehru Nagar is non-functional for over two weeks. The area is dark and unsafe at night.',
    category: 'electricity',
    status: 'resolved',
    priority: 'medium',
    department: 'Electricity Board',
    assignedOfficerId: 'u3',
    assignedOfficerName: 'Anita Desai',
    location: { address: '45, Nehru Nagar', ward: 'Ward 5', district: 'South', pincode: '560020' },
    attachments: [],
    timeline: [
      { id: 't6', status: 'submitted', note: 'Submitted via portal', updatedBy: 'Vikram Nair', updatedAt: '2024-03-01T09:00:00Z' },
      { id: 't7', status: 'acknowledged', note: 'Acknowledged', updatedBy: 'System', updatedAt: '2024-03-01T10:00:00Z' },
      { id: 't8', status: 'in_progress', note: 'Electrician dispatched', updatedBy: 'Anita Desai', updatedAt: '2024-03-02T11:00:00Z' },
      { id: 't9', status: 'resolved', note: 'Streetlight repaired and functional', updatedBy: 'Anita Desai', updatedAt: '2024-03-03T15:00:00Z' },
    ],
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-03-03T15:00:00Z',
    resolvedAt: '2024-03-03T15:00:00Z',
    satisfactionRating: 4,
    feedbackNote: 'Resolved quickly, thank you.',
  },
  {
    id: 'c4',
    referenceNumber: 'GRV-2024-00130',
    citizenId: 'u6',
    citizenName: 'Lalitha Reddy',
    citizenPhone: '+91-9444555666',
    title: 'Garbage not collected for 5 days',
    description: 'Garbage from our street has not been collected for 5 days. There is a severe stench and health hazard.',
    category: 'sanitation',
    status: 'submitted',
    priority: 'high',
    department: 'Sanitation',
    location: { address: 'Rose Garden Street, Koramangala', ward: 'Ward 19', district: 'East', pincode: '560034' },
    attachments: [],
    timeline: [
      { id: 't10', status: 'submitted', note: 'Submitted via portal', updatedBy: 'Lalitha Reddy', updatedAt: '2024-03-17T07:00:00Z' },
    ],
    createdAt: '2024-03-17T07:00:00Z',
    updatedAt: '2024-03-17T07:00:00Z',
    dueDate: '2024-03-19T07:00:00Z',
  },
  {
    id: 'c5',
    referenceNumber: 'GRV-2024-00118',
    citizenId: 'u7',
    citizenName: 'Arjun Patel',
    citizenPhone: '+91-9777888999',
    title: 'Illegal construction blocking road',
    description: 'Unauthorized construction near Plot 12, Industrial Area is blocking the service road. Emergency vehicles cannot pass.',
    category: 'encroachment',
    status: 'pending_info',
    priority: 'high',
    department: 'Public Works',
    assignedOfficerId: 'u3',
    assignedOfficerName: 'Anita Desai',
    location: { address: 'Plot 12, Industrial Area', ward: 'Ward 22', district: 'West', pincode: '560058' },
    attachments: [],
    timeline: [
      { id: 't11', status: 'submitted', note: 'Submitted', updatedBy: 'Arjun Patel', updatedAt: '2024-03-14T12:00:00Z' },
      { id: 't12', status: 'acknowledged', note: 'Acknowledged', updatedBy: 'System', updatedAt: '2024-03-14T12:30:00Z' },
      { id: 't13', status: 'pending_info', note: 'Officer needs site photographs and exact plot number', updatedBy: 'Anita Desai', updatedAt: '2024-03-15T10:00:00Z' },
    ],
    createdAt: '2024-03-14T12:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    dueDate: '2024-03-21T12:00:00Z',
  },
]

export const MOCK_TRANSCRIPTS: Transcript[] = [
  {
    id: 'tr1',
    callId: 'call1',
    language: 'en',
    totalDuration: 185,
    createdAt: '2024-03-16T08:00:00Z',
    updatedAt: '2024-03-16T08:03:05Z',
    segments: [
      { id: 's1', speaker: 'system', speakerName: 'IVR System', text: 'Welcome to GovConnect helpline. Press 1 for water, 2 for roads, 3 for electricity, or stay on the line.', startTime: 0, endTime: 8, confidence: 1.0 },
      { id: 's2', speaker: 'citizen', speakerName: 'Citizen', text: 'Hello, I need to report an urgent problem with our water supply. The water has been dirty and smells bad for two days.', startTime: 10, endTime: 18, confidence: 0.93, sentiment: 'negative' },
      { id: 's3', speaker: 'agent', speakerName: 'Rajan Mehta', text: 'Good morning, this is Rajan from the GovConnect helpline. I understand you have a water supply issue. Can you please provide your area name and your name?', startTime: 19, endTime: 28, confidence: 0.97, sentiment: 'neutral' },
      { id: 's4', speaker: 'citizen', speakerName: 'Citizen', text: 'Yes, I am Priya Sharma from Sector 7B, Block C. The water is completely brown and smells like sewage. My children are getting sick. This is very serious!', startTime: 29, endTime: 42, confidence: 0.91, sentiment: 'negative' },
      { id: 's5', speaker: 'agent', speakerName: 'Rajan Mehta', text: 'I completely understand, Mrs. Sharma. This sounds like an emergency. I am escalating this to our Water Supply department immediately with critical priority. You will receive a reference number via SMS.', startTime: 43, endTime: 57, confidence: 0.96, sentiment: 'positive' },
      { id: 's6', speaker: 'citizen', speakerName: 'Citizen', text: 'Thank you. Please make sure someone comes today. We have no drinking water.', startTime: 58, endTime: 65, confidence: 0.94, sentiment: 'neutral' },
      { id: 's7', speaker: 'agent', speakerName: 'Rajan Mehta', text: 'Absolutely. Your reference number is GRV-2024-00124. We will arrange emergency water supply tankers to your sector within 2 hours. Is there anything else I can help you with?', startTime: 66, endTime: 80, confidence: 0.98, sentiment: 'positive' },
      { id: 's8', speaker: 'citizen', speakerName: 'Citizen', text: 'No, that is all. Thank you so much.', startTime: 81, endTime: 85, confidence: 0.99, sentiment: 'positive' },
    ],
  },
]

export const MOCK_CALLS: Call[] = [
  {
    id: 'call1',
    callSid: 'CA_mock_001',
    citizenPhone: '+91-9876543210',
    citizenName: 'Priya Sharma',
    agentId: 'u2',
    agentName: 'Rajan Mehta',
    direction: 'inbound',
    status: 'completed',
    duration: 185,
    waitTime: 45,
    startedAt: '2024-03-16T08:00:00Z',
    endedAt: '2024-03-16T08:03:05Z',
    complaintId: 'c2',
    transcript: MOCK_TRANSCRIPTS[0],
    language: 'en',
    ivr_path: ['1', '2'],
  },
  {
    id: 'call2',
    callSid: 'CA_mock_002',
    citizenPhone: '+91-9444555666',
    citizenName: 'Lalitha Reddy',
    agentId: 'u2',
    agentName: 'Rajan Mehta',
    direction: 'inbound',
    status: 'active',
    waitTime: 12,
    startedAt: new Date(Date.now() - 120000).toISOString(),
    language: 'hi',
    ivr_path: ['4'],
  },
  {
    id: 'call3',
    callSid: 'CA_mock_003',
    citizenPhone: '+91-9111222333',
    citizenName: 'Vikram Nair',
    agentId: 'u2',
    agentName: 'Rajan Mehta',
    direction: 'inbound',
    status: 'queued',
    waitTime: 8,
    startedAt: new Date(Date.now() - 30000).toISOString(),
    language: 'en',
  },
  {
    id: 'call4',
    callSid: 'CA_mock_004',
    citizenPhone: '+91-9777888999',
    citizenName: 'Arjun Patel',
    agentId: 'u2',
    agentName: 'Rajan Mehta',
    direction: 'inbound',
    status: 'completed',
    duration: 320,
    waitTime: 22,
    startedAt: '2024-03-15T14:10:00Z',
    endedAt: '2024-03-15T14:15:20Z',
    complaintId: 'c5',
    language: 'en',
  },
]

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'complaint_update', title: 'Complaint Updated', message: 'GRV-2024-00123 status changed to In Progress', isRead: false, link: '/officer/cases/c1', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n2', type: 'escalation', title: 'New Escalation', message: 'GRV-2024-00124 has been escalated to Critical priority', isRead: false, link: '/officer/cases/c2', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'n3', type: 'new_assignment', title: 'New Case Assigned', message: 'Case GRV-2024-00130 has been assigned to you', isRead: true, link: '/officer/cases/c4', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n4', type: 'system', title: 'System Maintenance', message: 'Scheduled maintenance on Sunday 2am-4am IST', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
]

// ----------------------------------------------------------
// ANALYTICS MOCK DATA
// ----------------------------------------------------------

export const MOCK_ANALYTICS_SUMMARY: AnalyticsSummary = {
  totalComplaints: 1284,
  resolvedToday: 47,
  pendingEscalations: 12,
  avgResolutionHours: 38.4,
  citizenSatisfaction: 4.1,
  activeCalls: 3,
  callsToday: 124,
  aiProcessedCalls: 118,
}

export const MOCK_DEPARTMENT_STATS: DepartmentStat[] = [
  { department: 'Public Works', total: 380, resolved: 290, pending: 68, escalated: 22 },
  { department: 'Water Supply', total: 245, resolved: 198, pending: 35, escalated: 12 },
  { department: 'Electricity', total: 210, resolved: 185, pending: 20, escalated: 5 },
  { department: 'Sanitation', total: 195, resolved: 142, pending: 48, escalated: 5 },
  { department: 'Public Safety', total: 145, resolved: 98, pending: 30, escalated: 17 },
  { department: 'Revenue', total: 109, resolved: 80, pending: 25, escalated: 4 },
]

export const MOCK_TREND_DATA: TrendDataPoint[] = [
  { date: 'Mar 10', submitted: 42, resolved: 38, escalated: 4 },
  { date: 'Mar 11', submitted: 55, resolved: 44, escalated: 6 },
  { date: 'Mar 12', submitted: 38, resolved: 50, escalated: 3 },
  { date: 'Mar 13', submitted: 67, resolved: 48, escalated: 8 },
  { date: 'Mar 14', submitted: 51, resolved: 55, escalated: 5 },
  { date: 'Mar 15', submitted: 72, resolved: 60, escalated: 9 },
  { date: 'Mar 16', submitted: 49, resolved: 47, escalated: 4 },
]

export const MOCK_CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: 'Roads', count: 380, percentage: 29.6, color: '#3B82F6' },
  { category: 'Water Supply', count: 245, percentage: 19.1, color: '#06B6D4' },
  { category: 'Electricity', count: 210, percentage: 16.4, color: '#F59E0B' },
  { category: 'Sanitation', count: 195, percentage: 15.2, color: '#10B981' },
  { category: 'Public Safety', count: 145, percentage: 11.3, color: '#EF4444' },
  { category: 'Revenue', count: 109, percentage: 8.5, color: '#8B5CF6' },
]

export const MOCK_SENTIMENT_TREND: SentimentTrend[] = [
  { date: 'Mar 10', positive: 45, neutral: 35, negative: 20 },
  { date: 'Mar 11', positive: 40, neutral: 38, negative: 22 },
  { date: 'Mar 12', positive: 50, neutral: 32, negative: 18 },
  { date: 'Mar 13', positive: 38, neutral: 30, negative: 32 },
  { date: 'Mar 14', positive: 44, neutral: 36, negative: 20 },
  { date: 'Mar 15', positive: 52, neutral: 28, negative: 20 },
  { date: 'Mar 16', positive: 48, neutral: 33, negative: 19 },
]

export const MOCK_OFFICER_STATS: OfficerStats[] = [
  { officerId: 'u3', totalAssigned: 85, resolved: 72, pending: 11, escalated: 2, avgResolutionDays: 2.8, satisfactionAvg: 4.2 },
  { officerId: 'u8', totalAssigned: 64, resolved: 50, pending: 12, escalated: 2, avgResolutionDays: 3.5, satisfactionAvg: 3.9 },
  { officerId: 'u9', totalAssigned: 78, resolved: 60, pending: 15, escalated: 3, avgResolutionDays: 3.1, satisfactionAvg: 4.0 },
]

// Simulate paginated complaint fetch
export async function getMockComplaints(page = 1, pageSize = 10) {
  await new Promise(r => setTimeout(r, 400))
  const start = (page - 1) * pageSize
  const items = MOCK_COMPLAINTS.slice(start, start + pageSize)
  return {
    data: items,
    meta: { page, pageSize, total: MOCK_COMPLAINTS.length, totalPages: Math.ceil(MOCK_COMPLAINTS.length / pageSize) },
  }
}

export async function getMockComplaintById(id: string) {
  await new Promise(r => setTimeout(r, 300))
  return MOCK_COMPLAINTS.find(c => c.id === id) ?? null
}

export async function getMockCalls() {
  await new Promise(r => setTimeout(r, 300))
  return MOCK_CALLS
}
