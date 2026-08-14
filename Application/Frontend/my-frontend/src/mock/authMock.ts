import type { User, AuthTokens, LoginCredentials } from '@/types'

// ----------------------------------------------------------
// MOCK AUTH
// Replace with real API calls to Spring Boot /auth endpoints
// BACKEND_HOOK: POST /api/auth/login  →  { user, tokens }
// ----------------------------------------------------------

const MOCK_USERS: (User & { password: string })[] = [
  {
    id: 'u1',
    name: 'Priya Sharma',
    email: 'citizen@demo.gov.in',
    password: 'demo123',
    phone: '+91-9876543210',
    role: 'citizen',
    department: undefined,
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'u2',
    name: 'Rajan Mehta',
    email: 'agent@demo.gov.in',
    password: 'demo123',
    phone: '+91-9123456789',
    role: 'call_center',
    department: 'Call Center',
    createdAt: '2024-01-10T08:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'u3',
    name: 'Anita Desai',
    email: 'officer@demo.gov.in',
    password: 'demo123',
    phone: '+91-9988776655',
    role: 'officer',
    badge: 'OFF-2024-042',
    department: 'Public Works',
    createdAt: '2023-11-05T09:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'u4',
    name: 'Suresh Kumar',
    email: 'admin@demo.gov.in',
    password: 'demo123',
    phone: '+91-9001122334',
    role: 'admin',
    department: 'Administration',
    createdAt: '2023-06-01T07:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
]

function makeFakeToken(userId: string): string {
  // Fake JWT-shaped string; not cryptographically valid
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + 3600000 }))
  return `${header}.${payload}.mock_signature`
}

export async function mockLogin(
  credentials: LoginCredentials
): Promise<{ user: User; tokens: AuthTokens }> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 600))

  const found = MOCK_USERS.find(
    u => u.email === credentials.email && u.password === credentials.password
  )

  if (!found) {
    throw new Error('Invalid email or password. Try citizen@demo.gov.in / demo123')
  }

  const { password: _pw, ...user } = found

  const tokens: AuthTokens = {
    accessToken: makeFakeToken(user.id),
    refreshToken: makeFakeToken(`refresh_${user.id}`),
    expiresIn: 3600,
  }

  return { user, tokens }
}

export { MOCK_USERS }
