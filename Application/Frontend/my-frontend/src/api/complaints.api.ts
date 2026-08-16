import { supabase, AGENT_BASE } from '@/lib/supabase'
import type {
  Complaint, ComplaintFilters, NewComplaintForm,
  ComplaintStatus, ComplaintPriority, ComplaintCategory,
  ApiResponse, PaginationMeta,
} from '@/types'

// ──────────────────────────────────────────────────────────────
// Helper: map a raw Supabase row → Complaint shape
// ──────────────────────────────────────────────────────────────
function rowToComplaint(row: Record<string, unknown>): Complaint {
  const insights = (row.ai_insights as Record<string, unknown>) ?? {}
  return {
    id:              String(row.id),
    referenceNumber: String(row.reference_number ?? ''),
    citizenId:       String(row.citizen_id ?? ''),
    citizenName:     String(row.citizen_name ?? ''),
    citizenPhone:    row.citizen_phone as string | undefined,
    title:           String(row.title ?? ''),
    description:     String(row.description ?? ''),
    category:        (row.category as ComplaintCategory) ?? 'other',
    subCategory:     row.sub_category as string | undefined,
    status:          (row.status as ComplaintStatus) ?? 'submitted',
    priority:        (row.priority as ComplaintPriority) ?? 'medium',
    department:      String(row.department_name ?? ''),
    assignedOfficerId:   row.assigned_officer_id as string | undefined,
    assignedOfficerName: row.assigned_officer_name as string | undefined,
    location: {
      address:  String(row.address ?? ''),
      ward:     row.ward as string | undefined,
      district: String(row.district ?? ''),
      pincode:  row.pincode as string | undefined,
      coordinates: (row.geo_lat && row.geo_lng)
        ? { lat: Number(row.geo_lat), lng: Number(row.geo_lng) }
        : undefined,
    },
    attachments: [],
    timeline:    [],
    aiInsights: Object.keys(insights).length > 0 ? {
      id:               String(row.id),
      sourceId:         String(row.id),
      sourceType:       'complaint',
      sentiment:        (insights.sentiment as never) ?? 'neutral',
      sentimentScore:   0,
      detectedTopics:   (insights.detected_topics as string[]) ?? [],
      entities:         [],
      summary:          String(insights.cleaned_description ?? row.description ?? ''),
      suggestedActions: (insights.suggested_actions as never[]) ?? [],
      urgencyScore:     Number(insights.urgency_score ?? 30),
      predictedCategory:    row.category as ComplaintCategory,
      predictedDepartment:  String(row.department_name ?? ''),
      detectedLanguage:     String(row.detected_language ?? 'en'),
      modelVersion:     String(insights.model_version ?? 'gemini-2.5-flash'),
      processedAt:      String(insights.processed_at ?? row.created_at ?? ''),
    } : undefined,
    createdAt:   String(row.created_at ?? ''),
    updatedAt:   String(row.updated_at ?? row.created_at ?? ''),
    resolvedAt:  row.resolved_at as string | undefined,
    dueDate:     row.due_date as string | undefined,
    satisfactionRating: row.satisfaction_rating as number | undefined,
    feedbackNote:       row.feedback_note as string | undefined,
  }
}

// ──────────────────────────────────────────────────────────────
// Agent helper — POST text complaint to complaint_agent.py
// ──────────────────────────────────────────────────────────────
async function callAgent(
  form: NewComplaintForm,
  citizenId: string,
  citizenName: string,
  citizenPhone?: string,
  originalTranscript?: string,
  detectedLanguage?: string,
): Promise<Complaint> {
  const body = {
    title:               form.title,
    description:         form.description,
    citizen_id:          citizenId,
    citizen_name:        citizenName,
    citizen_phone:       citizenPhone ?? null,
    address:             form.address ?? null,
    ward:                form.ward    ?? null,
    district:            form.district,
    pincode:             form.pincode ?? null,
    input_mode:          originalTranscript ? 'audio' : 'text',
    original_transcript: originalTranscript ?? null,
    detected_language:   detectedLanguage   ?? 'en',
  }

  const res = await fetch(`${AGENT_BASE}/process`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`Agent error (${res.status}): ${err}`)
  }

  const data = await res.json()
  // Convert agent response to Complaint shape
  return rowToComplaint({
    ...data,
    reference_number:     data.reference_number,
    department_name:      data.department_name,
    assigned_officer_name: data.assigned_officer_name,
  } as Record<string, unknown>)
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

export const complaintsApi = {

  /** List complaints with optional filters. Uses Supabase directly. */
  list: async (filters?: ComplaintFilters): Promise<ApiResponse<Complaint[]> & { meta: PaginationMeta }> => {
    const page     = filters?.page     ?? 1
    const pageSize = filters?.pageSize ?? 20
    const from     = (page - 1) * pageSize
    const to       = from + pageSize - 1

    let query = supabase
      .from('complaints')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters?.search)
      query = query.ilike('title', `%${filters.search}%`)
    if (filters?.status?.length)
      query = query.in('status', filters.status)
    if (filters?.priority?.length)
      query = query.in('priority', filters.priority)
    if (filters?.category?.length)
      query = query.in('category', filters.category)
    if (filters?.department?.length)
      query = query.in('department_name', filters.department)
    if (filters?.dateFrom)
      query = query.gte('created_at', filters.dateFrom)
    if (filters?.dateTo)
      query = query.lte('created_at', filters.dateTo)
    if (filters?.assignedOfficerId)
      query = query.eq('assigned_officer_id', filters.assignedOfficerId)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const total     = count ?? 0
    const complaints = (data ?? []).map(r => rowToComplaint(r as Record<string, unknown>))

    return {
      success: true,
      data:    complaints,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  },

  /** Get single complaint by ID. */
  getById: async (id: string): Promise<ApiResponse<Complaint>> => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return { success: true, data: rowToComplaint(data as Record<string, unknown>) }
  },

  /**
   * Submit a new complaint.
   * Sends to complaint_agent.py which:
   *   1. Classifies via Gemini
   *   2. Determines severity score (1-5) + emergency flag
   *   3. Recommends department
   *   4. Saves to Supabase
   *   5. Auto-assigns to officer
   */
  create: async (
    form: NewComplaintForm,
    citizenId: string,
    citizenName: string,
    options?: {
      citizenPhone?:       string
      originalTranscript?: string
      detectedLanguage?:   string
      audioBlob?:          Blob
    }
  ): Promise<ApiResponse<Complaint>> => {
    const complaint = await callAgent(
      form,
      citizenId,
      citizenName,
      options?.citizenPhone,
      options?.originalTranscript,
      options?.detectedLanguage,
    )
    return { success: true, data: complaint }
  },

  /** Update complaint status (officer/admin). */
  updateStatus: async (id: string, status: ComplaintStatus, note?: string): Promise<ApiResponse<Complaint>> => {
    const user = JSON.parse(localStorage.getItem('govconnect_user') ?? '{}') as { id?: string; name?: string }

    const { data, error } = await supabase
      .from('complaints')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)

    // Timeline entry
    await supabase.from('complaint_timeline').insert({
      complaint_id:     id,
      status,
      note:             note ?? `Status updated to ${status}`,
      updated_by:       user.id,
      updated_by_name:  user.name ?? 'System',
    })

    return { success: true, data: rowToComplaint(data as Record<string, unknown>) }
  },

  /** Assign complaint to an officer (admin). */
  assign: async (id: string, officerId: string): Promise<ApiResponse<Complaint>> => {
    // Fetch officer name
    const { data: officer } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', officerId)
      .single()

    const { data, error } = await supabase
      .from('complaints')
      .update({
        assigned_officer_id: officerId,
        assigned_at:         new Date().toISOString(),
        status:              'in_progress',
        updated_at:          new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)

    // Notify officer
    if (officer) {
      const complaint = data as Record<string, unknown>
      await supabase.from('notifications').insert({
        user_id:  officerId,
        type:     'new_assignment',
        title:    `Complaint Assigned — ${complaint.reference_number}`,
        message:  `You have been assigned complaint: ${complaint.title}`,
        link:     `/officer/case/${id}`,
        metadata: { complaint_id: id },
      })
    }

    return { success: true, data: rowToComplaint(data as Record<string, unknown>) }
  },

  /** Submit citizen feedback/rating. */
  submitFeedback: async (id: string, rating: number, note?: string): Promise<ApiResponse<void>> => {
    const { error } = await supabase
      .from('complaints')
      .update({
        satisfaction_rating: rating,
        feedback_note:       note ?? null,
        status:              'closed',
        updated_at:          new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true, data: undefined as never }
  },

  /** Get complaints for the logged-in citizen. */
  getMyCcomplaints: async (citizenId: string, filters?: ComplaintFilters): Promise<ApiResponse<Complaint[]>> => {
    const page     = filters?.page     ?? 1
    const pageSize = filters?.pageSize ?? 20
    const from     = (page - 1) * pageSize
    const to       = from + pageSize - 1

    let query = supabase
      .from('complaints')
      .select('*', { count: 'exact' })
      .eq('citizen_id', citizenId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters?.status?.length) query = query.in('status', filters.status)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return { success: true, data: (data ?? []).map(r => rowToComplaint(r as Record<string, unknown>)) }
  },

  /** Track complaint by reference number (public). */
  trackByReference: async (referenceNumber: string): Promise<ApiResponse<Complaint>> => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('reference_number', referenceNumber)
      .single()
    if (error) throw new Error(`Complaint "${referenceNumber}" not found`)
    return { success: true, data: rowToComplaint(data as Record<string, unknown>) }
  },

  /** Get timeline events for a complaint. */
  getTimeline: async (complaintId: string) => {
    const { data, error } = await supabase
      .from('complaint_timeline')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  /** Get KPI summary (admin dashboard). */
  getKpis: async () => {
    const { data, error } = await supabase.from('complaint_kpis').select('*').single()
    if (error) throw new Error(error.message)
    return data
  },

  /** Get per-department stats (admin analytics). */
  getDepartmentStats: async () => {
    const { data, error } = await supabase.from('department_stats').select('*')
    if (error) throw new Error(error.message)
    return data ?? []
  },
}
