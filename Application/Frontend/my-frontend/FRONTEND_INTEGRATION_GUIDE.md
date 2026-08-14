# GovConnect — Frontend Integration Guide

This guide explains exactly how to connect the React frontend to:
1. Spring Boot backend (REST + JWT)
2. WebSocket live transcription
3. AI/NLP microservice
4. File uploads
5. Deployment

---

## 1. Spring Boot Backend — REST API

### 1.1 Base URL Configuration

Set the backend URL in your local environment file:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api
```

The Axios client in `src/api/client.ts` reads this variable automatically. In development, Vite also proxies `/api` → `http://localhost:8080` via `vite.config.ts`, so you can also leave `VITE_API_BASE_URL` unset and let the proxy handle it.

### 1.2 CORS Configuration (Spring Boot side)

Your Spring Boot application must allow requests from the frontend origin:

```java
// Spring Boot: WebMvcConfigurer or SecurityFilterChain
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173", "https://your-production-domain.gov.in"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

### 1.3 JWT Authentication Flow

**Login:**
1. User submits credentials in `LoginPage.tsx`
2. `AuthContext.login()` calls `mockLogin()` — **replace with** `authApi.login(credentials)`
3. Backend returns `{ user: User, tokens: { accessToken, refreshToken, expiresIn } }`
4. Tokens and user are stored in `localStorage` under keys `govconnect_tokens` / `govconnect_user`
5. On every subsequent request, `src/api/client.ts` attaches `Authorization: Bearer <accessToken>`

**Token Refresh:**
The response interceptor in `src/api/client.ts` handles 401s. To enable automatic refresh, uncomment the `BACKEND_HOOK` block in the interceptor and point it at `POST /api/auth/refresh`:

```typescript
// src/api/client.ts — response interceptor (currently commented out)
const res = await axios.post(`${BASE_URL}/auth/refresh`, {
  refreshToken: tokens.refreshToken
})
localStorage.setItem('govconnect_tokens', JSON.stringify(res.data.tokens))
originalRequest.headers['Authorization'] = `Bearer ${res.data.tokens.accessToken}`
return apiClient(originalRequest)
```

**Logout:**
`AuthContext.logout()` clears localStorage. To also invalidate server-side, call `authApi.logout(refreshToken)` before clearing:

```typescript
// src/contexts/AuthContext.tsx — logout callback
await authApi.logout(state.tokens!.refreshToken)  // add this line
clearSession()
dispatch({ type: 'AUTH_LOGOUT' })
```

### 1.4 Expected API Response Envelope

All backend endpoints must return this envelope (matches `ApiResponse<T>` in `src/types/index.ts`):

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 245,
    "totalPages": 25
  }
}
```

Error responses (4xx/5xx):
```json
{
  "success": false,
  "errors": ["Validation failed"],
  "data": null
}
```

### 1.5 Swapping Mock Calls → Real API (page by page)

For each page below, find the `// BACKEND_HOOK` comment and replace the mock call:

#### Citizen Dashboard (`src/pages/citizen/CitizenDashboard.tsx`)
```typescript
// Before (mock):
getMockComplaints(1, 5).then(res => { ... })

// After (real API):
complaintsApi.getMyCcomplaints(user!.id, { page: 1, pageSize: 5 })
  .then(res => { setComplaints(res.data.data); setLoading(false) })
```

#### New Complaint (`src/pages/citizen/NewComplaintPage.tsx`)
```typescript
// Before (mock):
await new Promise(r => setTimeout(r, 1000))

// After (real API):
const res = await complaintsApi.create({ ...data, attachments: files })
const newComplaint = res.data.data
toast.success(`Complaint filed! Reference: ${newComplaint.referenceNumber}`)
```

#### Call Center Dashboard (`src/pages/call-center/CallCenterDashboard.tsx`)
```typescript
// Before (mock):
getMockCalls().then(data => { setCalls(data); setLoading(false) })

// After (real API):
callsApi.getQueue().then(res => { setCalls(res.data.data); setLoading(false) })
```

#### Officer Dashboard (`src/pages/officer/OfficerDashboard.tsx`)
```typescript
// Before (mock):
getMockComplaints(page, 10).then(...)

// After (real API):
complaintsApi.list({ assignedOfficerId: user!.id, ...filters, page })
  .then(res => { setComplaints(res.data.data); setMeta(res.data.meta!); setLoading(false) })
```

#### Case Detail (`src/pages/officer/CaseDetailPage.tsx`)
```typescript
// Before (mock):
getMockComplaintById(id)

// After (real API):
complaintsApi.getById(id).then(res => { setComplaint(res.data.data); setLoading(false) })
```

#### Admin Analytics (`src/pages/admin/AdminAnalyticsPage.tsx`)
```typescript
// Before (mock):
setSummary(MOCK_ANALYTICS_SUMMARY)

// After (real API):
const [summaryRes, trendsRes, deptRes] = await Promise.all([
  analyticsApi.getSummary(),
  analyticsApi.getTrends(7),
  analyticsApi.getDepartmentStats(),
])
setSummary(summaryRes.data.data)
setTrends(trendsRes.data.data)
setDeptStats(deptRes.data.data)
```

#### Track Complaint (`src/pages/public/TrackComplaintPage.tsx`)
```typescript
// Before (mock):
const found = MOCK_COMPLAINTS.find(c => c.referenceNumber === refInput)

// After (real API — public endpoint, no auth header needed):
const res = await complaintsApi.trackByReference(refInput)
setComplaint(res.data.data)
```

---

## 2. WebSocket — Live Call Transcription

### 2.1 Architecture

```
Browser ──WS──▶ Spring Boot (STOMP over WebSocket)
                    │
                    └──▶ AI Transcription service (gRPC/REST)
                                │
                            segments pushed back to browser via WS
```

### 2.2 Enable the Feature Flag

```bash
# .env.local
VITE_ENABLE_LIVE_TRANSCRIPT=true
VITE_WS_URL=ws://localhost:8080
```

### 2.3 Connecting in `CallCenterDashboard.tsx`

The `TranscriptWebSocket` class is already in `src/api/calls.api.ts`. Uncomment and use it:

```typescript
// src/pages/call-center/CallCenterDashboard.tsx
import { TranscriptWebSocket } from '@/api/calls.api'
import type { TranscriptSegment } from '@/types'

const [liveSegments, setLiveSegments] = useState<TranscriptSegment[]>([])

useEffect(() => {
  if (!activeCallId) return
  const ws = new TranscriptWebSocket(activeCallId)
  ws.connect(
    (segment) => setLiveSegments(prev => [...prev, segment]),
    () => console.log('Call ended, transcript complete')
  )
  return () => ws.disconnect()
}, [activeCallId])

// Then pass to TranscriptPanel:
<TranscriptPanel liveSegments={liveSegments} autoScroll />
```

### 2.4 Spring Boot WebSocket Endpoint Contract

The frontend expects the backend to expose:

```
ws://<host>/ws/transcript/{callId}?token=<accessToken>
```

Each message must be a JSON `TranscriptSegment` object:

```json
{
  "id": "seg_001",
  "speaker": "citizen",
  "speakerName": "Caller",
  "text": "My water supply has been disrupted...",
  "startTime": 12.4,
  "endTime": 18.1,
  "confidence": 0.94,
  "sentiment": "negative",
  "isLive": true
}
```

### 2.5 Push Notifications via WebSocket

Uncomment the WebSocket block in `src/contexts/NotificationContext.tsx`:

```typescript
// src/contexts/NotificationContext.tsx
useEffect(() => {
  const token = JSON.parse(localStorage.getItem('govconnect_tokens') ?? '{}')?.accessToken
  const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/notifications?token=${token}`)
  wsRef.current = ws
  ws.onmessage = (event) => {
    const notification: Notification = JSON.parse(event.data)
    dispatch({ type: 'ADD', payload: notification })
  }
  return () => ws.close()
}, [])
```

---

## 3. AI / NLP Microservice

### 3.1 Architecture

```
Frontend ──REST──▶ Spring Boot Gateway ──REST──▶ AI Microservice (Python/FastAPI)
```

The frontend never calls the AI service directly — Spring Boot acts as a gateway at `/api/ai/*`.

### 3.2 Enable the Feature Flag

```bash
VITE_ENABLE_AI_CATEGORIZE=true
```

### 3.3 Auto-Categorization (New Complaint Form)

In `src/pages/citizen/NewComplaintPage.tsx`, the "AI Suggest Category" button already calls `aiApi.categorize()`. Uncomment it:

```typescript
// Replace the mock delay block:
const res = await aiApi.categorize(descriptionValue)
setAiSuggestion({
  category: res.data.data.predictedCategory,
  department: res.data.data.predictedDepartment,
  confidence: res.data.data.confidence,
})
```

### 3.4 Complaint Insights (Case Detail Page)

```typescript
// src/pages/officer/CaseDetailPage.tsx
useEffect(() => {
  if (!complaint) return
  // AI_HOOK: fetch AI insights for this complaint
  aiApi.getComplaintInsights(complaint.id)
    .then(res => setAiInsights(res.data.data))
}, [complaint])
```

### 3.5 Expected AI API Response Shapes

**POST /api/ai/categorize:**
```json
{
  "success": true,
  "data": {
    "predictedCategory": "roads",
    "predictedDepartment": "Public Works",
    "confidence": 0.91,
    "suggestedPriority": "high"
  }
}
```

**GET /api/ai/insights/complaint/:id:**
```json
{
  "success": true,
  "data": {
    "id": "ai_001",
    "sentiment": "frustrated",
    "sentimentScore": -0.72,
    "urgencyScore": 78,
    "summary": "Citizen reports...",
    "detectedTopics": ["pothole", "road damage"],
    "entities": [...],
    "suggestedActions": [...],
    "modelVersion": "govai-v1.2",
    "processedAt": "2024-03-15T10:05:00Z"
  }
}
```

---

## 4. File Uploads

### 4.1 Complaint Attachments

`complaintsApi.create()` already sends a `multipart/form-data` request. The Spring Boot endpoint must accept:

```
POST /api/complaints
Content-Type: multipart/form-data

Fields: title, description, category, address, district, pincode, ward
Files:  attachments[] (multiple files)
```

Spring Boot controller:
```java
@PostMapping(value = "/complaints", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<ApiResponse<Complaint>> create(
    @RequestParam String title,
    @RequestParam String description,
    @RequestParam(required = false) MultipartFile[] attachments
) { ... }
```

### 4.2 Avatar Upload

`usersApi.uploadAvatar(file)` sends:

```
POST /api/users/me/avatar
Content-Type: multipart/form-data
Field: avatar (single file)
```

Returns: `{ "data": { "avatarUrl": "https://storage.../avatars/u1.jpg" } }`

---

## 5. Deployment

### 5.1 Build

```bash
npm run build
# Output: dist/ folder
```

### 5.2 Environment Variables for Production

Create `.env.production` (not committed):

```bash
VITE_API_BASE_URL=https://api.govconnect.gov.in/api
VITE_WS_URL=wss://api.govconnect.gov.in
VITE_ENABLE_LIVE_TRANSCRIPT=true
VITE_ENABLE_AI_CATEGORIZE=true
VITE_ENABLE_WEBSOCKET_NOTIFICATIONS=true
```

### 5.3 Nginx Config (Single-Page App)

React Router uses client-side routing. Nginx must serve `index.html` for all routes:

```nginx
server {
    listen 80;
    server_name govconnect.gov.in;
    root /var/www/govconnect/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to Spring Boot
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Authorization $http_authorization;
    }

    # Proxy WebSocket
    location /ws/ {
        proxy_pass http://localhost:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
}
```

### 5.4 Docker

```dockerfile
# Dockerfile (multi-stage)
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t govconnect-frontend .
docker run -p 80:80 \
  -e VITE_API_BASE_URL=https://api.govconnect.gov.in/api \
  govconnect-frontend
```

---

## 6. Testing Data Flows End-to-End

### 6.1 Test Login Flow
1. Start Spring Boot backend on port 8080
2. Start frontend dev server: `npm run dev`
3. Navigate to `http://localhost:5173/login`
4. Enter real credentials or demo credentials
5. Verify JWT stored in browser localStorage (`govconnect_tokens`)
6. Verify redirect to role-specific dashboard

### 6.2 Test Complaint Creation
1. Login as Citizen
2. Navigate to `/citizen/new`
3. Fill form and submit
4. Verify complaint appears in `/citizen/history`
5. Verify reference number returned from API

### 6.3 Test AI Categorization
1. Enable `VITE_ENABLE_AI_CATEGORIZE=true`
2. On New Complaint form, type a description with at least 20 chars
3. Click "AI Suggest Category"
4. Verify call to `POST /api/ai/categorize` in browser Network tab
5. Verify suggested category/department appears

### 6.4 Test Live Transcript
1. Enable `VITE_ENABLE_LIVE_TRANSCRIPT=true` and set `VITE_WS_URL`
2. Login as Call Center agent
3. When an active call is present, the `TranscriptPanel` will open a WebSocket to `/ws/transcript/{callId}`
4. Backend must push `TranscriptSegment` JSON objects
5. Verify segments appear in real-time in the transcript panel

### 6.5 Verify All Integration Points
```bash
# List every integration point in the codebase:
grep -rn "BACKEND_HOOK\|AI_HOOK\|WEBSOCKET_HOOK" src/ --include="*.tsx" --include="*.ts"
```

---

## 7. Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| 401 on every request | JWT not attached | Check `client.ts` request interceptor reads `govconnect_tokens` |
| CORS errors in browser | Backend not configured | Add frontend origin to Spring Boot CORS config |
| WebSocket disconnects | Missing `Upgrade` header | Add WebSocket proxy headers to Nginx |
| Charts don't render | Container has no height | Ensure parent has explicit height or use `min-h` |
| Infinite redirect loop | Role mismatch in route guard | Check `defaultRouteForRole()` in `src/router/index.tsx` |
| File upload 413 | Nginx body size limit | Add `client_max_body_size 20M;` to Nginx config |
| Build fails on types | Missing `@types/*` package | Run `npm install` — all types are in `package.json` |
