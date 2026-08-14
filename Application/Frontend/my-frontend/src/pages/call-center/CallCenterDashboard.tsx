import React, { useEffect, useState } from 'react'
import {
  Phone, PhoneOff, PhoneIncoming, Clock, Users,
  Mic, MicOff, PhoneMissed, Brain,
} from 'lucide-react'
import { cn, formatDuration, timeAgo } from '@/lib/utils'
import { StatCard, TranscriptPanel, AIInsightCard, EmptyState, Spinner } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getMockCalls } from '@/mock/data'
import { MOCK_TRANSCRIPTS, MOCK_AI_INSIGHTS } from '@/mock/data'
import type { Call } from '@/types'

export default function CallCenterDashboard() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCallId, setActiveCallId] = useState<string | null>('call2')
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    // BACKEND_HOOK: Replace with callsApi.getQueue() + callsApi.list({ status: ['active','queued'] })
    getMockCalls().then(data => {
      setCalls(data)
      setLoading(false)
    })
  }, [])

  const activeCalls = calls.filter(c => c.status === 'active' || c.status === 'ringing')
  const queuedCalls = calls.filter(c => c.status === 'queued')
  const completedToday = calls.filter(c => c.status === 'completed')

  const selectedCall = activeCallId ? calls.find(c => c.id === activeCallId) : null
  const liveTranscript = selectedCall?.id === 'call1' ? MOCK_TRANSCRIPTS[0] : undefined

  // WEBSOCKET_HOOK: Subscribe to live transcript for active call
  // useEffect(() => {
  //   if (!activeCallId) return
  //   const ws = new TranscriptWebSocket(activeCallId)
  //   ws.connect((seg) => setLiveSegments(prev => [...prev, seg]))
  //   return () => ws.disconnect()
  // }, [activeCallId])

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard title="Active Calls" value={activeCalls.length}
          icon={Phone} iconBg="bg-green-50" iconColor="text-green-600"
          subtitle="Right now" />
        <StatCard title="In Queue" value={queuedCalls.length}
          icon={PhoneIncoming} iconBg="bg-yellow-50" iconColor="text-yellow-600"
          subtitle="Waiting" />
        <StatCard title="Handled Today" value={completedToday.length}
          icon={PhoneOff} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard title="Avg Wait" value="1:45"
          icon={Clock} iconBg="bg-purple-50" iconColor="text-purple-600"
          subtitle="minutes" />
      </div>

      {/* Three-column layout */}
      <div className="flex-1 grid lg:grid-cols-[280px_1fr_300px] gap-4 min-h-0">

        {/* ── Column 1: Call Queue ─────────────────────── */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 sticky top-0 bg-gray-50 py-1">
            <Users className="w-4 h-4" /> Call Queue
          </h2>

          {loading ? (
            <Spinner label="Loading calls…" />
          ) : calls.length === 0 ? (
            <EmptyState icon={Phone} title="No calls" size="sm" />
          ) : (
            calls.map(call => (
              <CallQueueCard
                key={call.id}
                call={call}
                isSelected={activeCallId === call.id}
                onSelect={() => setActiveCallId(call.id)}
              />
            ))
          )}
        </div>

        {/* ── Column 2: Active Call / Transcript ──────── */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          {selectedCall ? (
            <>
              {/* Call header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{selectedCall.citizenName ?? selectedCall.citizenPhone}</p>
                    <p className="text-blue-200 text-xs">{selectedCall.citizenPhone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CallStatusDot status={selectedCall.status} />
                    <span className="text-sm capitalize">{selectedCall.status.replace('_', ' ')}</span>
                  </div>
                </div>
                {/* Controls */}
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant={muted ? 'secondary' : 'outline'}
                    className={cn('border-white/30 text-white hover:bg-white/10', muted && 'bg-red-500/80 border-red-400')}
                    onClick={() => setMuted(v => !v)}
                  >
                    {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {muted ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Hold
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Transfer
                  </Button>
                  <Button size="sm" className="bg-red-500 hover:bg-red-600 ml-auto">
                    <PhoneOff className="w-4 h-4" /> End
                  </Button>
                </div>
              </div>

              {/* Transcript tabs */}
              <div className="flex-1 overflow-hidden p-4">
                <Tabs defaultValue="transcript" className="h-full flex flex-col">
                  <TabsList className="shrink-0">
                    <TabsTrigger value="transcript">Live Transcript</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="transcript" className="flex-1 overflow-y-auto mt-3">
                    {/* WEBSOCKET_HOOK: Pass liveSegments for active calls */}
                    <TranscriptPanel
                      transcript={liveTranscript}
                      autoScroll
                      className="min-h-full"
                    />
                  </TabsContent>
                  <TabsContent value="notes" className="flex-1">
                    <textarea
                      className="w-full h-full min-h-[200px] p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add call notes…"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <EmptyState
              icon={PhoneIncoming}
              title="No call selected"
              description="Select a call from the queue to view details"
            />
          )}
        </Card>

        {/* ── Column 3: AI Insights ────────────────────── */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 sticky top-0 bg-gray-50 py-1">
            <Brain className="w-4 h-4 text-purple-600" /> AI Insights
          </h2>

          {selectedCall ? (
            <>
              {/* AI_HOOK: Display AI insights for the selected call */}
              <AIInsightCard insights={MOCK_AI_INSIGHTS[1]} defaultExpanded />

              {/* Quick complaint creation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-gray-500">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" size="sm">
                    Create Complaint from Call
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Escalate to Supervisor
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Request Callback
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState icon={Brain} title="Select a call" description="AI insights appear here when a call is active" size="sm" />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────

function CallQueueCard({
  call, isSelected, onSelect,
}: { call: Call; isSelected: boolean; onSelect: () => void }) {
  const statusColors: Record<string, string> = {
    active: 'border-l-green-500 bg-green-50',
    ringing: 'border-l-blue-500 bg-blue-50 animate-pulse',
    queued: 'border-l-yellow-500',
    completed: 'border-l-gray-300',
    missed: 'border-l-red-500',
  }

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 rounded-lg border border-gray-200 border-l-4 transition-all',
        'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
        statusColors[call.status] ?? 'border-l-gray-300',
        isSelected && 'ring-2 ring-blue-500 shadow-sm'
      )}
      aria-pressed={isSelected}
      aria-label={`Call from ${call.citizenName ?? call.citizenPhone}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900 truncate">
          {call.citizenName ?? call.citizenPhone}
        </span>
        <CallStatusDot status={call.status} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{call.citizenPhone}</span>
        <span>{timeAgo(call.startedAt)}</span>
      </div>
      {call.duration && (
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDuration(call.duration)}
        </div>
      )}
      {call.language && call.language !== 'en' && (
        <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded uppercase">
          {call.language}
        </span>
      )}
    </button>
  )
}

function CallStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-500 animate-pulse',
    ringing: 'bg-blue-500 animate-bounce',
    queued: 'bg-yellow-500',
    completed: 'bg-gray-400',
    missed: 'bg-red-500',
    on_hold: 'bg-orange-500',
  }
  return (
    <span
      className={cn('w-2 h-2 rounded-full inline-block shrink-0', colors[status] ?? 'bg-gray-400')}
      aria-label={status}
    />
  )
}
