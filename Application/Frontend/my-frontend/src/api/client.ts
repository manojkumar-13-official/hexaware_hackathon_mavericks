import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// ----------------------------------------------------------
// AXIOS API CLIENT
// BACKEND_HOOK: Set VITE_API_BASE_URL in .env to point at
// Spring Boot backend: http://localhost:8080/api
// ----------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ----------------------------------------------------------
// REQUEST INTERCEPTOR — attach JWT access token
// BACKEND_HOOK: Spring Boot expects "Authorization: Bearer <token>"
// ----------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('govconnect_tokens')
      if (raw) {
        const tokens = JSON.parse(raw)
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`
        }
      }
    } catch {
      // ignore
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ----------------------------------------------------------
// RESPONSE INTERCEPTOR — handle 401 token refresh
// BACKEND_HOOK: On 401, call /auth/refresh and retry original request
// ----------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // BACKEND_HOOK: POST /api/auth/refresh
        // const raw = localStorage.getItem('govconnect_tokens')
        // const tokens = JSON.parse(raw!)
        // const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: tokens.refreshToken })
        // localStorage.setItem('govconnect_tokens', JSON.stringify(res.data.tokens))
        // originalRequest.headers!['Authorization'] = `Bearer ${res.data.tokens.accessToken}`
        // return apiClient(originalRequest)
        console.warn('Token refresh not implemented — redirecting to login')
        window.location.href = '/login'
      } catch {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
