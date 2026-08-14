import apiClient from './client'
import type { ApiResponse, AIInsights } from '@/types'

// ----------------------------------------------------------
// AI MICROSERVICE API STUBS
// AI_HOOK: These endpoints proxy to the AI/NLP microservice
// via the Spring Boot gateway (Spring Cloud Gateway or
// direct REST calls to the AI service)
// ----------------------------------------------------------

export const aiApi = {
  /**
   * AI_HOOK: GET /api/ai/insights/complaint/:id
   * Fetches AI analysis for a complaint
   * Microservice: POST /nlp/analyze-complaint → { insights }
   */
  getComplaintInsights: (complaintId: string) =>
    apiClient.get<ApiResponse<AIInsights>>(`/ai/insights/complaint/${complaintId}`),

  /**
   * AI_HOOK: GET /api/ai/insights/call/:id
   * Fetches AI analysis for a completed call
   * Microservice: POST /nlp/analyze-call → { insights }
   */
  getCallInsights: (callId: string) =>
    apiClient.get<ApiResponse<AIInsights>>(`/ai/insights/call/${callId}`),

  /**
   * AI_HOOK: POST /api/ai/categorize
   * Predict category and department from free-text description
   * Body: { text: string }
   * Used to auto-fill category/department in the complaint form
   */
  categorize: (text: string) =>
    apiClient.post<ApiResponse<{
      predictedCategory: string
      predictedDepartment: string
      confidence: number
      suggestedPriority: string
    }>>('/ai/categorize', { text }),

  /**
   * AI_HOOK: POST /api/ai/summarize
   * Summarize a call or complaint text
   * Body: { text: string, type: 'call' | 'complaint' }
   */
  summarize: (text: string, type: 'call' | 'complaint') =>
    apiClient.post<ApiResponse<{ summary: string }>>('/ai/summarize', { text, type }),

  /**
   * AI_HOOK: POST /api/ai/translate
   * Translate text to English from detected language
   * Body: { text: string, targetLanguage?: string }
   */
  translate: (text: string, targetLanguage = 'en') =>
    apiClient.post<ApiResponse<{ translatedText: string; detectedLanguage: string }>>(
      '/ai/translate',
      { text, targetLanguage }
    ),

  /**
   * AI_HOOK: GET /api/ai/similar-complaints/:id
   * Find similar past complaints using vector similarity search
   */
  getSimilarComplaints: (complaintId: string) =>
    apiClient.get<ApiResponse<{ id: string; referenceNumber: string; similarity: number }[]>>(
      `/ai/similar-complaints/${complaintId}`
    ),
}
