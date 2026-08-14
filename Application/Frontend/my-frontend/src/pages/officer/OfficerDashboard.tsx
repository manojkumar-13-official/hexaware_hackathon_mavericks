import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts'
import { StatCard, ComplaintCard, SearchFilterBar, Pagination, ListSkeleton, EmptyState } from '@/components/shared'
import { getMockComplaints } from '@/mock/data'
import type { Complaint, PaginationMeta } from '@/types'

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'pending_info', label: 'Pending Info' },
  { value: 'resolved', label: 'Resolved' },
]

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function OfficerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 1 })

  useEffect(() => {
    setLoading(true)
    // BACKEND_HOOK: complaintsApi.list({ assignedOfficerId: user.id, ...filters, search, page })
    getMockComplaints(page, 10).then(res => {
      setComplaints(res.data)
      setMeta(res.meta)
      setLoading(false)
    })
  }, [page, search, filters])

  const criticalCount = complaints.filter(c => c.priority === 'critical').length
  const overdueCount = complaints.filter(c =>
    c.dueDate && new Date(c.dueDate) < new Date() && c.status !== 'resolved'
  ).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Officer Dashboard
        </h1>
        <p className="text-sm text-gray-500">Welcome, {user?.name} · {user?.department}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned" value={meta.total}
          icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard title="Critical" value={criticalCount}
          icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatCard title="Overdue" value={overdueCount}
          icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-600" />
        <StatCard title="Resolved Today" value="8"
          icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600"
          trend={{ value: 12, label: 'vs yesterday' }} />
      </div>

      {/* My Performance */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {/* Filter bar */}
          <div className="mb-3">
            <SearchFilterBar
              searchValue={search}
              onSearchChange={v => { setSearch(v); setPage(1) }}
              searchPlaceholder="Search cases…"
              filterGroups={[
                { key: 'status', label: 'Status', options: STATUS_OPTIONS },
                { key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS },
              ]}
              activeFilters={filters}
              onFilterChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1) }}
              onClearFilters={() => setFilters({})}
            />
          </div>

          {loading ? (
            <ListSkeleton rows={4} />
          ) : complaints.length === 0 ? (
            <EmptyState icon={FileText} title="No cases found" description="Adjust filters or check back later." size="sm" />
          ) : (
            <div className="space-y-3">
              {complaints.map(c => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  variant="officer"
                  onClick={() => navigate(`/officer/cases/${c.id}`)}
                />
              ))}
            </div>
          )}

          <div className="mt-4">
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        </div>

        {/* Quick stats panel */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">My Performance</span>
            </div>
            {[
              { label: 'Resolved this week', value: '23', color: 'text-green-600' },
              { label: 'Avg resolution days', value: '2.8', color: 'text-blue-600' },
              { label: 'Citizen rating', value: '4.2/5', color: 'text-yellow-600' },
              { label: 'SLA compliance', value: '94%', color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Escalations */}
          {criticalCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">Action Required</span>
              </div>
              <p className="text-xs text-red-600">
                {criticalCount} critical complaint{criticalCount > 1 ? 's' : ''} require immediate attention.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
