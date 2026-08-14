import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, User, MapPin, Paperclip, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge, PriorityBadge, AIInsightCard, TranscriptPanel, PageLoader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime, formatDate } from '@/lib/utils'
import { getMockComplaintById } from '@/mock/data'
import type { Complaint, ComplaintStatus } from '@/types'
import { FileText } from 'lucide-react'

const STATUS_TRANSITIONS: ComplaintStatus[] = ['acknowledged', 'in_progress', 'pending_info', 'escalated', 'resolved', 'closed']

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | ''>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    // BACKEND_HOOK: complaintsApi.getById(id)
    getMockComplaintById(id).then(c => {
      setComplaint(c)
      setLoading(false)
    })
  }, [id])

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !complaint) return
    setSaving(true)
    // BACKEND_HOOK: complaintsApi.updateStatus(complaint.id, selectedStatus, note)
    await new Promise(r => setTimeout(r, 600))
    toast.success(`Status updated to "${selectedStatus.replace('_', ' ')}"`)
    setSaving(false)
  }

  if (loading) return <PageLoader message="Loading case…" />
  if (!complaint) return (
    <EmptyState icon={FileText} title="Case not found"
      action={{ label: 'Back to Dashboard', onClick: () => navigate('/officer') }} />
  )

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back nav */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/officer')} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-mono text-blue-600 font-medium">{complaint.referenceNumber}</span>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">{complaint.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">{complaint.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Filed by</p>
            <p className="font-medium text-gray-700 flex items-center gap-1">
              <User className="w-3 h-3" />{complaint.citizenName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Location</p>
            <p className="font-medium text-gray-700 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{complaint.location.district}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Filed on</p>
            <p className="font-medium text-gray-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />{formatDate(complaint.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Category</p>
            <p className="font-medium text-gray-700 capitalize">{complaint.category.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-5">
        {/* Left: tabs */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {complaint.aiInsights && (
              <AIInsightCard insights={complaint.aiInsights} />
            )}

            {complaint.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Attachments ({complaint.attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {complaint.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-700 truncate">{att.fileName}</span>
                      <a href={att.url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs shrink-0 ml-2">
                        View
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardContent className="pt-4 space-y-3">
                {complaint.timeline.map((item, i) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                        i === 0 ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                      {i < complaint.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-gray-400">{formatDateTime(item.updatedAt)}</span>
                        <span className="text-xs text-gray-500">by {item.updatedBy}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.note}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcript">
            {/* WEBSOCKET_HOOK: For completed calls, show static transcript; for active, connect WebSocket */}
            {complaint.callId ? (
              <Card>
                <CardContent className="pt-4">
                  <TranscriptPanel transcript={undefined} isLoading={false} />
                </CardContent>
              </Card>
            ) : (
              <EmptyState icon={MessageSquare} title="No call transcript" description="This complaint was not filed via phone." size="sm" />
            )}
          </TabsContent>
        </Tabs>

        {/* Right: actions */}
        <div className="space-y-4">
          {/* Update status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                onValueChange={(v) => setSelectedStatus(v as ComplaintStatus)}
                defaultValue={complaint.status}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_TRANSITIONS.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Add a note (optional)…"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />

              <Button
                className="w-full"
                size="sm"
                loading={saving}
                onClick={handleStatusUpdate}
                disabled={!selectedStatus}
              >
                Update Status
              </Button>
            </CardContent>
          </Card>

          {/* Complaint meta */}
          <Card>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Department</p>
                <p className="font-medium text-gray-700">{complaint.department}</p>
              </div>
              {complaint.assignedOfficerName && (
                <div>
                  <p className="text-xs text-gray-400">Assigned Officer</p>
                  <p className="font-medium text-gray-700">{complaint.assignedOfficerName}</p>
                </div>
              )}
              {complaint.dueDate && (
                <div>
                  <p className="text-xs text-gray-400">Due Date</p>
                  <p className={`font-medium ${new Date(complaint.dueDate) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatDate(complaint.dueDate)}
                    {new Date(complaint.dueDate) < new Date() && ' ⚠ Overdue'}
                  </p>
                </div>
              )}
              {complaint.satisfactionRating && (
                <div>
                  <p className="text-xs text-gray-400">Citizen Satisfaction</p>
                  <p className="font-medium text-yellow-600">{'⭐'.repeat(complaint.satisfactionRating)} {complaint.satisfactionRating}/5</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
