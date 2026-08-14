import React, { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatCard, CardSkeleton } from '@/components/shared'
import {
  MOCK_ANALYTICS_SUMMARY, MOCK_DEPARTMENT_STATS, MOCK_TREND_DATA,
  MOCK_CATEGORY_BREAKDOWN, MOCK_SENTIMENT_TREND,
} from '@/mock/data'
import type { AnalyticsSummary } from '@/types'

// BACKEND_HOOK: Replace mock data with analyticsApi calls
// AI_HOOK: Sentiment trend data comes from AI microservice

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = () => {
    setLoading(true)
    // BACKEND_HOOK: analyticsApi.getSummary() + getTrends() + getDepartmentStats()
    setTimeout(() => {
      setSummary(MOCK_ANALYTICS_SUMMARY)
      setLoading(false)
    }, 600)
  }

  useEffect(() => { loadData() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(r => setTimeout(r, 800))
    setRefreshing(false)
  }

  const handleExport = () => {
    // BACKEND_HOOK: analyticsApi.exportReport('csv')
    alert('Export: connect analyticsApi.exportReport()')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">System-wide complaint & call intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton count={4} />
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Complaints" value={summary.totalComplaints.toLocaleString()}
            trend={{ value: 8, label: 'vs last month' }} />
          <StatCard title="Resolved Today" value={summary.resolvedToday}
            trend={{ value: 15, label: 'vs yesterday' }} />
          <StatCard title="Pending Escalations" value={summary.pendingEscalations} />
          <StatCard title="Avg Resolution" value={`${summary.avgResolutionHours}h`}
            trend={{ value: -5, label: 'improvement' }} />
        </div>
      )}

      {/* Chart tabs */}
      <Tabs defaultValue="trends">
        <TabsList className="mb-4">
          <TabsTrigger value="trends">Resolution Trends</TabsTrigger>
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
        </TabsList>

        {/* ── Resolution Trend (Area chart) ─────────────── */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Complaint Resolution Trend (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={MOCK_TREND_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Legend />
                  <Area type="monotone" dataKey="submitted" stroke="#3B82F6" fill="url(#colorSubmitted)"
                    strokeWidth={2} name="Submitted" dot={false} />
                  <Area type="monotone" dataKey="resolved" stroke="#10B981" fill="url(#colorResolved)"
                    strokeWidth={2} name="Resolved" dot={false} />
                  <Line type="monotone" dataKey="escalated" stroke="#EF4444"
                    strokeWidth={2} name="Escalated" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Department Stats (Grouped Bar) ─────────────── */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Complaints by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={MOCK_DEPARTMENT_STATS} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="resolved" name="Resolved" fill="#10B981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="escalated" name="Escalated" fill="#EF4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Summary table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm" aria-label="Department summary">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Department</th>
                      <th className="text-right py-2 px-2 text-xs text-gray-500 font-semibold">Total</th>
                      <th className="text-right py-2 px-2 text-xs text-gray-500 font-semibold">Resolved</th>
                      <th className="text-right py-2 px-2 text-xs text-gray-500 font-semibold">Resolution %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_DEPARTMENT_STATS.map(d => (
                      <tr key={d.department} className="border-b border-gray-50">
                        <td className="py-2 px-2 font-medium text-gray-700">{d.department}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{d.total}</td>
                        <td className="py-2 px-2 text-right text-green-600 font-medium">{d.resolved}</td>
                        <td className="py-2 px-2 text-right">
                          <span className={`text-xs font-semibold ${(d.resolved / d.total) > 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {((d.resolved / d.total) * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Category Breakdown (Donut + list) ─────────── */}
        <TabsContent value="categories">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={MOCK_CATEGORY_BREAKDOWN}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="category"
                    >
                      {MOCK_CATEGORY_BREAKDOWN.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} complaints`, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_CATEGORY_BREAKDOWN.map(({ category, count, percentage, color }) => (
                    <div key={category} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="flex-1 text-sm text-gray-700">{category}</span>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sentiment Trend (Stacked area) ─────────────── */}
        {/* AI_HOOK: Data from NLP microservice sentiment aggregation */}
        <TabsContent value="sentiment">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                Citizen Sentiment Trend
                <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-normal">
                  AI_HOOK: NLP Microservice
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={MOCK_SENTIMENT_TREND} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  stackOffset="expand">
                  <defs>
                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorNeu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6B7280" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#6B7280" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${(Number(value) * 100).toFixed(1)}%`]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="positive" stackId="1" stroke="#10B981" fill="url(#colorPos)" name="Positive" />
                  <Area type="monotone" dataKey="neutral" stackId="1" stroke="#6B7280" fill="url(#colorNeu)" name="Neutral" />
                  <Area type="monotone" dataKey="negative" stackId="1" stroke="#EF4444" fill="url(#colorNeg)" name="Negative" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
