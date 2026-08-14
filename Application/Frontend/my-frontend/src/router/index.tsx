import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { Layout, PublicLayout } from '@/components/layout/Layout'
import { PageLoader } from '@/components/shared'
import type { UserRole } from '@/types'

// ----------------------------------------------------------
// Lazy-loaded pages
// ----------------------------------------------------------

// Public
const LandingPage       = lazy(() => import('@/pages/public/LandingPage'))
const LoginPage         = lazy(() => import('@/pages/public/LoginPage'))
const TrackComplaint    = lazy(() => import('@/pages/public/TrackComplaintPage'))
const HelpPage          = lazy(() => import('@/pages/public/HelpPage'))

// Citizen
const CitizenDashboard  = lazy(() => import('@/pages/citizen/CitizenDashboard'))
const NewComplaint      = lazy(() => import('@/pages/citizen/NewComplaintPage'))
const ComplaintHistory  = lazy(() => import('@/pages/citizen/ComplaintHistoryPage'))
const CitizenProfile    = lazy(() => import('@/pages/citizen/CitizenProfilePage'))

// Call Center
const CallCenterDashboard = lazy(() => import('@/pages/call-center/CallCenterDashboard'))

// Officer
const OfficerDashboard  = lazy(() => import('@/pages/officer/OfficerDashboard'))
const CaseDetailPage    = lazy(() => import('@/pages/officer/CaseDetailPage'))

// Admin
const AdminDashboard    = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers        = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminAnalytics    = lazy(() => import('@/pages/admin/AdminAnalyticsPage'))
const AdminSettings     = lazy(() => import('@/pages/admin/AdminSettingsPage'))

// ----------------------------------------------------------
// Route guards
// ----------------------------------------------------------

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

/** Redirect authenticated users away from public-only pages (e.g. /login) */
function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <PageLoader />
  if (isAuthenticated && user) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />
  }
  return <>{children}</>
}

/** Require authentication; redirect to /login otherwise */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Require specific roles; redirect to role-default if unauthorised */
function RoleGuard({
  roles,
  children,
}: {
  roles: UserRole[]
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user || !roles.includes(user.role)) {
    return <Navigate to={user ? defaultRouteForRole(user.role) : '/login'} replace />
  }
  return <>{children}</>
}

function defaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'citizen':     return '/citizen'
    case 'call_center': return '/call-center'
    case 'officer':     return '/officer'
    case 'admin':       return '/admin'
    default:            return '/'
  }
}

// ----------------------------------------------------------
// Authenticated shell wrapper (Layout + auth check)
// ----------------------------------------------------------
function AuthenticatedLayout({ title, roles }: { title?: string; roles?: UserRole[] }) {
  return (
    <AuthGuard>
      {roles ? (
        <RoleGuard roles={roles}>
          <Layout title={title}>
            <SuspenseWrapper>
              <Outlet />
            </SuspenseWrapper>
          </Layout>
        </RoleGuard>
      ) : (
        <Layout title={title}>
          <SuspenseWrapper>
            <Outlet />
          </SuspenseWrapper>
        </Layout>
      )}
    </AuthGuard>
  )
}

// ----------------------------------------------------------
// Router definition
// ----------------------------------------------------------
export const router = createBrowserRouter([
  // ── Public routes (no auth required) ──────────────────
  {
    path: '/',
    element: (
      <PublicLayout>
        <SuspenseWrapper>
          <Outlet />
        </SuspenseWrapper>
      </PublicLayout>
    ),
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: (
          <GuestGuard>
            <LoginPage />
          </GuestGuard>
        ),
      },
      {
        path: 'track-complaint',
        element: <TrackComplaint />,
      },
      {
        path: 'help',
        element: <HelpPage />,
      },
    ],
  },

  // ── Citizen routes ─────────────────────────────────────
  {
    path: '/citizen',
    element: <AuthenticatedLayout roles={['citizen']} />,
    children: [
      { index: true,           element: <CitizenDashboard /> },
      { path: 'new',           element: <NewComplaint /> },
      { path: 'history',       element: <ComplaintHistory /> },
      { path: 'profile',       element: <CitizenProfile /> },
    ],
  },

  // ── Call Center routes ─────────────────────────────────
  {
    path: '/call-center',
    element: <AuthenticatedLayout roles={['call_center', 'admin']} title="Call Center" />,
    children: [
      { index: true, element: <CallCenterDashboard /> },
    ],
  },

  // ── Officer routes ─────────────────────────────────────
  {
    path: '/officer',
    element: <AuthenticatedLayout roles={['officer', 'admin']} title="Officer Portal" />,
    children: [
      { index: true,           element: <OfficerDashboard /> },
      { path: 'cases/:id',     element: <CaseDetailPage /> },
    ],
  },

  // ── Admin routes ───────────────────────────────────────
  {
    path: '/admin',
    element: <AuthenticatedLayout roles={['admin']} title="Administration" />,
    children: [
      { index: true,           element: <AdminDashboard /> },
      { path: 'users',         element: <AdminUsers /> },
      { path: 'analytics',     element: <AdminAnalytics /> },
      { path: 'settings',      element: <AdminSettings /> },
    ],
  },

  // ── Catch-all ─────────────────────────────────────────
  {
    path: '*',
    element: (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <p className="text-xl font-semibold text-gray-700">Page not found</p>
        <a href="/" className="text-blue-600 hover:underline text-sm">Back to home</a>
      </div>
    ),
  },
])
