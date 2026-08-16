import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Users, TrendingUp, AlertTriangle,
  CheckCircle, Clock, BarChart3, ArrowRight,
  Zap, Shield, Brain, RefreshCw, UserCheck,
} from 'lucide-react'
import { StatCard, ComplaintCard, ListSkeleton } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase, AGENT_BASE } from '@/lib/supabase'
import { complaintsApi } from '@/api/complaints.api'
import type { Complaint } from '@/types'

// ─── types ────────────────────────────────────────────────────
interface Kpis {
  total:            number
  submitted:        number
  in_progress:      number
  escalated:        number
  resolved:         number
  emergencies:      number
  unassigned:       number
  avg_resolution_hours: number
  submitted_today:  number
}

interface AgentHealth {
  gemini:   boolean
  supabase: boolean
  mode:     string
}

// ─── helpers ──────────────────────────────────────────────────
const priorityColors: Record<string, string> = {
  critical: 'destructive',
  high:     'warning',
  medium:   'default',
  low:      'secondary',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [kpis, setKpis]                   = useState<Kpis | null>(null)
  const [recent, setRecent]               = useState<Complaint[]>([])
  const [emergencies, setEmergencies]     = useState<Complaint[]>([])
  const [unassigned, setUnassigned]       = useState<Complaint[]>([])
  const [agentHealth, setAgentHealth]     = useState<AgentHealth | null>(null)
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)

  const loadData = useCallback(async () => {
    try {
      // KPIs from view
      const kpiRes = await supabase.from('complaint_kpis').select('*').single()
      if (kpiRes.data) setKpis(kpiRes.data as Kpis)

      // Recent complaints (last 5)
      const recentRes = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (recentRes.data) {
        setRecent(recentRes.data.map(r => ({
          id:              String(r.id),
          referenceNumber: String(r.reference_number ?? ''),
          citizenId:       String(r.citizen_id ?? ''),
          citizenName:     String(r.citizen_name ?? ''),
          title:           String(r.title ?? ''),
          description:     String(r.description ?? ''),
          category:        r.category as never,
          status:          r.status as never,
          priority:        r.priority as never,
          department:      String(r.department_name ?? ''),
          location:        { address: String(r.address ?? ''), district: String(r.district ?? '') },
          attachments:     [],
          timeline:        [],
          createdAt:       String(r.created_at ?? ''),
          updatedAt:       String(r.updated_at ?? ''),
        })))
      }

      // Emergencies not yet resolved
      const emerRes = await supabase
        .from('complaints')
        .select('*')
        .eq('is_emergency', true)
        .not('status', 'in', '("resolved","closed","rejected")')
        .order('created_at', { ascending: false })
        .limit(3)
      if (emerRes.data) {
        setEmergencies(emerRes.data.map(r => ({
          id: String(r.id), referenceNumber: String(r.reference_number ?? ''),
          citizenId: String(r.citizen_id ?? ''), citizenName: String(r.citizen_name ?? ''),
          title: String(r.title ?? ''), description: String(r.description ?? ''),
          category: r.category as never, status: r.status as never, priority: r.priority as never,
          department: String(r.department_name ?? ''),
          location: { address: String(r.address ?? ''), district: String(r.district ?? '') },
          attachments: [], timeline: [],
          createdAt: String(r.created_at ?? ''), updatedAt: String(r.updated_at ?? ''),
        })))
      }

      // Unassigned complaints
      const unasRes = await supabase
        .from('complaints')
        .select('*')
        .is('assigned_officer_id', null)
        .not('status', 'in', '("resolved","closed","rejected")')
        .order('created_at', { ascending: false })
        .limit(3)
      if (unasRes.data) {
        setUnassigned(unasRes.data.map(r => ({
          id: String(r.id), referenceNumber: String(r.reference_number ?? ''),
          citizenId: String(r.citizen_id ?? ''), citizenName: String(r.citizen_name ?? ''),
          title: String(r.title ?? ''), description: String(r.description ?? ''),
          category: r.category as never, status: r.status as never, priority: r.priority as never,
          department: String(r.department_name ?? ''),
          location: { address: String(r.address ?? ''), district: String(r.district ?? '') },
          attachments: [], timeline: [],
          createdAt: String(r.created_at ?? ''), updatedAt: String(r.updated_at ?? ''),
        })))
      }

      // Agent health check
      try {
        const h = await fetch(`${AGENT_BASE}/health`, { signal: AbortSignal.timeout(2000) })
        if (h.ok) setAgentHealth(await h.json() as AgentHealth)
      } catch { /* agent offline */ }

    } catch (err) {
      console.error('AdminDashboard load error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = () => { setRefreshing(true); loadData() }

  // Assign officer to a complaint
  const handleAssign = async (complaintId: string) => {
    // Navigate to case detail where admin can pick officer
    navigate(`/officer/cases/${complaintId}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-sm text-gray-500">Live data from Supabase</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/analytics')}>
            <BarChart3 className="w-4 h-4" /> Full Analytics
          </Button>
        </div>
      </div>

      {/* Emergency banner */}
      {emergencies.length > 0 && (
        <div className="bg-red-600 text-white rounded-xl px-5 py-4 flex items-center gap-3">
          <Zap className="w-5 h-5 shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-bold text-sm">
              {emergencies.length} Active Emergency{emergencies.length > 1 ? 's' : ''}
            </p>
            <p className="text-red-100 text-xs">
              {emergencies.map(e => e.referenceNumber).join(' · ')} — immediate action required
            </p>
          </div>
          <Button size="sm" className="bg-white text-red-700 hover:bg-red-50 shrink-0"
            onClick={() => navigate('/admin/analytics')}>
            View All
          </Button>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints"
          value={kpis?.total?.toLocaleString() ?? '–'}
          icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600" loading={loading} />
        <StatCard title="Submitted Today"
          value={kpis?.submitted_today ?? '–'}
          icon={TrendingUp} iconBg="bg-indigo-50" iconColor="text-indigo-600" loading={loading} />
        <StatCard title="Emergencies Active"
          value={kpis?.emergencies ?? '–'}
          icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" loading={loading} />
        <StatCard title="Avg Resolution"
          value={kpis ? `${kpis.avg_resolution_hours}h` : '–'}
          icon={Clock} iconBg="bg-yellow-50" iconColor="text-yellow-600" loading={loading} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="In Progress"
          value={kpis?.in_progress ?? '–'}
          icon={Clock} iconBg="bg-purple-50" iconColor="text-purple-600" loading={loading} />
        <StatCard title="Escalated"
          value={kpis?.escalated ?? '–'}
          icon={AlertTriangle} iconBg="bg-orange-50" iconColor="text-orange-600" loading={loading} />
        <StatCard title="Resolved Total"
          value={kpis?.resolved ?? '–'}
          icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" loading={loading} />
        <StatCard title="Unassigned"
          value={kpis?.unassigned ?? '–'}
          icon={UserCheck} iconBg="bg-slate-50" iconColor="text-slate-600" loading={loading} />
      </div>

      {/* Main two-column layout */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">

        {/* Recent complaints */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Complaints</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/analytics')}>
              View all <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {loading ? <ListSkeleton rows={4} /> : (
            <div className="space-y-3">
              {recent.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No complaints yet</p>
              ) : recent.map(c => (
                <ComplaintCard key={c.id} complaint={c} variant="admin"
                  onClick={() => navigate(`/officer/cases/${c.id}`)} />
              ))}
            </div>
          )}

          {/* Unassigned alert */}
          {unassigned.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unassigned Complaints ({kpis?.unassigned ?? unassigned.length})
                </h2>
              </div>
              <div className="space-y-2">
                {unassigned.map(c => (
                  <div key={c.id}
                    className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-500 truncate">{c.referenceNumber} · {c.department}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={(priorityColors[c.priority] ?? 'default') as never} className="capitalize text-xs">
                        {c.priority}
                      </Badge>
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleAssign(c.id)}>
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-3">
          {/* Quick links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: 'Manage Users',  icon: Users,    to: '/admin/users'     },
                { label: 'Full Analytics',icon: BarChart3, to: '/admin/analytics' },
                { label: 'System Settings',icon: Shield,  to: '/admin/settings'  },
              ].map(({ label, icon: Icon, to }) => (
                <button key={to} onClick={() => navigate(to)}
                  className="w-full flex items-center gap-2 text-sm text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
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
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {[
                {
                  name:   'Supabase DB',
                  ok:     !!kpis,                  // if we got KPIs, DB is up
                },
                {
                  name:   'AI Agent',
                  ok:     !!agentHealth,
                  sub:    agentHealth ? (agentHealth.gemini ? 'Gemini live' : 'Mock mode') : undefined,
                },
                {
                  name:   'STT Agent',
                  ok:     true,
                  sub:    'port 5002',
                },
              ].map(({ name, ok, sub }) => (
                <div key={name} className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-600">{name}</span>
                    {sub && <span className="text-gray-400 ml-1">({sub})</span>}
                  </div>
                  <span className={`font-medium flex items-center gap-1 ${ok ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
                    {ok ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}

              {agentHealth && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-purple-600">
                  <Brain className="w-3 h-3" />
                  <span>AI mode: <strong>{agentHealth.mode}</strong></span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
