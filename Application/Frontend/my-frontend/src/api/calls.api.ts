import apiClient from './client'
import type { ApiResponse, Call, CallFilters, Transcript } from '@/types'

// ----------------------------------------------------------
// CALLS API STUBS
// BACKEND_HOOK: Spring Boot /api/calls (backed by Twilio/IVR)
// ----------------------------------------------------------

export const callsApi = {
  /**
   * BACKEND_HOOK: GET /api/calls
   * Returns paginated call list for call center agents
   */
  list: (filters?: CallFilters) =>
    apiClient.get<ApiResponse<Call[]>>('/calls', { params: filters }),

  /**
   * BACKEND_HOOK: GET /api/calls/:id
   */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Call>>(`/calls/${id}`),

  /**
   * BACKEND_HOOK: GET /api/calls/:id/transcript
   */
  getTranscript: (callId: string) =>
    apiClient.get<ApiResponse<Transcript>>(`/calls/${callId}/transcript`),

  /**
   * BACKEND_HOOK: GET /api/calls/queue
   * Returns current call queue for the agent
   */
  getQueue: () =>
    apiClient.get<ApiResponse<Call[]>>('/calls/queue'),

  /**
   * BACKEND_HOOK: PATCH /api/calls/:id/hold
   */
  hold: (callId: string) =>
    apiClient.patch<ApiResponse<Call>>(`/calls/${callId}/hold`),

  /**
   * BACKEND_HOOK: PATCH /api/calls/:id/transfer
   */
  transfer: (callId: string, targetDepartment: string) =>
    apiClient.patch<ApiResponse<Call>>(`/calls/${callId}/transfer`, { targetDepartment }),

  /**
   * BACKEND_HOOK: POST /api/calls/:id/end
   */
  end: (callId: string) =>
    apiClient.post<ApiResponse<Call>>(`/calls/${callId}/end`),
}

// ----------------------------------------------------------
// WEBSOCKET HOOK — Live Transcript Streaming
// WEBSOCKET_HOOK: Connect to Spring Boot STOMP WebSocket
// for real-time transcript updates during active calls
// ----------------------------------------------------------
export class TranscriptWebSocket {
  private ws: WebSocket | null = null
  private callId: string

  constructor(callId: string) {
    this.callId = callId
  }

  /**
   * WEBSOCKET_HOOK: Connect to ws://localhost:8080/ws/transcript/{callId}
   * Messages: TranscriptSegment JSON objects
   */
  connect(onSegment: (segment: import('@/types').TranscriptSegment) => void, onEnd?: () => void) {
    const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'
    const token = (() => {
      try {
        return JSON.parse(localStorage.getItem('govconnect_tokens') ?? '{}')?.accessToken ?? ''
      } catch { return '' }
    })()

    this.ws = new WebSocket(`${wsUrl}/ws/transcript/${this.callId}?token=${token}`)

    this.ws.onmessage = (event) => {
      try {
        const segment = JSON.parse(event.data)
        onSegment(segment)
      } catch { /* ignore malformed messages */ }
    }

    this.ws.onclose = () => onEnd?.()
    this.ws.onerror = (e) => console.error('TranscriptWebSocket error', e)
  }

  disconnect() {
    this.ws?.close()
    this.ws = null
  }
}
