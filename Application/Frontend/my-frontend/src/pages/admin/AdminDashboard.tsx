import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Phone, Users, TrendingUp, AlertTriangle,
  CheckCircle, Clock, BarChart3, ArrowRight,
} from 'lucide-react'
import { StatCard, ComplaintCard, ListSkeleton } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MOCK_ANALYTICS_SUMMARY, MOCK_COMPLAINTS } from '@/mock/data'
import type { AnalyticsSummary } from '@/types'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // BACKEND_HOOK: analyticsApi.getSummary()
    setTimeout(() => {
      setSummary(MOCK_ANALYTICS_SUMMARY)
      setLoading(false)
    }, 500)
  }, [])

  const recentComplaints = MOCK_COMPLAINTS.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-sm text-gray-500">System-wide performance at a glance</p>
        </div>
        <Button size="sm" onClick={() => navigate('/admin/analytics')}>
          <BarChart3 className="w-4 h-4" /> Full Analytics
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={summary?.totalComplaints.toLocaleString() ?? '–'}
          icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600"
          loading={loading} trend={{ value: 8, label: 'vs last week' }} />
        <StatCard title="Resolved Today" value={summary?.resolvedToday ?? '–'}
          icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600"
          loading={loading} trend={{ value: 15, label: 'vs yesterday' }} />
        <StatCard title="Pending Escalations" value={summary?.pendingEscalations ?? '–'}
          icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600"
          loading={loading} />
        <StatCard title="Avg Resolution" value={summary ? `${summary.avgResolutionHours}h` : '–'}
          icon={Clock} iconBg="bg-yellow-50" iconColor="text-yellow-600"
          loading={loading} trend={{ value: -5, label: 'improved' }} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Calls" value={summary?.activeCalls ?? '–'}
          icon={Phone} iconBg="bg-indigo-50" iconColor="text-indigo-600"
          loading={loading} />
        <StatCard title="Calls Today" value={summary?.callsToday ?? '–'}
          icon={Phone} iconBg="bg-purple-50" iconColor="text-purple-600"
          loading={loading} />
        <StatCard title="AI Processed" value={summary?.aiProcessedCalls ?? '–'}
          subtitle="calls today"
          icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600"
          loading={loading} />
        <StatCard title="Satisfaction" value={summary ? `${summary.citizenSatisfaction}/5` : '–'}
          icon={Users} iconBg="bg-green-50" iconColor="text-green-600"
          loading={loading} />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Recent complaints */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Recent Complaints</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/analytics')}>
              View all <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {loading ? (
            <ListSkeleton rows={3} />
          ) : (
            <div className="space-y-3">
              {recentComplaints.map(c => (
                <ComplaintCard key={c.id} complaint={c} variant="admin"
                  onClick={() => navigate(`/officer/cases/${c.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Manage Users', icon: Users, to: '/admin/users' },
                { label: 'Full Analytics', icon: BarChart3, to: '/admin/analytics' },
                { label: 'Call Center', icon: Phone, to: '/call-center' },
                { label: 'System Settings', icon: AlertTriangle, to: '/admin/settings' },
              ].map(({ label, icon: Icon, to }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="w-full flex items-center gap-2 text-sm text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  {label}
                  <ArrowRight className="w-3 h-3 ml-auto text-gray-300" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* System health */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                System Health
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {[
                { name: 'API Gateway', status: 'Operational' },
                { name: 'AI Microservice', status: 'Operational' },
                { name: 'WebSocket Server', status: 'Operational' },
                { name: 'Database', status: 'Operational' },
              ].map(({ name, status }) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-gray-600">{name}</span>
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
