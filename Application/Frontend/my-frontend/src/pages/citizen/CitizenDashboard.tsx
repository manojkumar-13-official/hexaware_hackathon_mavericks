import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts'
import { StatCard, ComplaintCard, ListSkeleton, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { getMockComplaints } from '@/mock/data'
import type { Complaint } from '@/types'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // BACKEND_HOOK: Replace with complaintsApi.getMyCcomplaints(user!.id)
    getMockComplaints(1, 5).then(res => {
      setComplaints(res.data)
      setLoading(false)
    })
  }, [])

  const stats = {
    total: complaints.length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    escalated: complaints.filter(c => c.status === 'escalated').length,
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Here's a summary of your grievances
          </p>
        </div>
        <Button onClick={() => navigate('/citizen/new')} size="sm">
          <PlusCircle className="w-4 h-4" /> New Complaint
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats.total} icon={FileText}
          iconBg="bg-blue-50" iconColor="text-blue-600"
          onClick={() => navigate('/citizen/history')} />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock}
          iconBg="bg-yellow-50" iconColor="text-yellow-600" />
        <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle}
          iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard title="Escalated" value={stats.escalated} icon={AlertTriangle}
          iconBg="bg-red-50" iconColor="text-red-600" />
      </div>

      {/* Recent complaints */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Recent Complaints</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/citizen/history')}>
            View all
          </Button>
        </div>

        {loading ? (
          <ListSkeleton rows={3} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No complaints yet"
            description="File your first complaint and we'll track it for you."
            action={{ label: 'File a Complaint', onClick: () => navigate('/citizen/new') }}
          />
        ) : (
          <div className="space-y-3">
            {complaints.map(c => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                variant="citizen"
                onClick={() => navigate(`/citizen/history`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
