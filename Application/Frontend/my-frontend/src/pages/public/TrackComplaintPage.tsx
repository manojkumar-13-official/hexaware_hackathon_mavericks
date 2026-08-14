import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, MapPin, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge, PriorityBadge } from '@/components/shared'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { Complaint } from '@/types'
import { MOCK_COMPLAINTS } from '@/mock/data'

export default function TrackComplaintPage() {
  const [searchParams] = useSearchParams()
  const [refInput, setRefInput] = useState(searchParams.get('ref') ?? '')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refInput.trim()) return
    setLoading(true)
    setNotFound(false)
    setComplaint(null)

    // BACKEND_HOOK: Replace with complaintsApi.trackByReference(refInput)
    await new Promise(r => setTimeout(r, 600))
    const found = MOCK_COMPLAINTS.find(
      c => c.referenceNumber.toLowerCase() === refInput.trim().toLowerCase()
    )
    setLoading(false)
    if (found) setComplaint(found)
    else setNotFound(true)
  }

  const statusSteps = [
    'submitted', 'acknowledged', 'in_progress', 'resolved',
  ] as const

  const currentStepIndex = complaint
    ? Math.max(
        statusSteps.indexOf(
          complaint.status === 'escalated' ? 'in_progress' :
          complaint.status === 'pending_info' ? 'in_progress' :
          complaint.status === 'closed' ? 'resolved' :
          complaint.status as typeof statusSteps[number]
        ),
        0
      )
    : -1

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Complaint</h1>
          <p className="text-gray-500 text-sm">Enter your reference number to check the status of your grievance.</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="e.g. GRV-2024-00123"
            value={refInput}
            onChange={e => setRefInput(e.target.value)}
            className="flex-1"
            aria-label="Reference number"
          />
          <Button type="submit" disabled={loading} loading={loading}>
            {loading ? '' : 'Track'}
          </Button>
        </form>

        {/* Not found */}
        {notFound && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700" role="alert">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Complaint not found</p>
              <p className="text-sm">No record found for <code className="font-mono">{refInput}</code>. Please check the reference number and try again.</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-gray-400 py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Searching…</span>
          </div>
        )}

        {/* Result */}
        {complaint && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Top banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs text-blue-200 mb-0.5">Reference Number</p>
                  <p className="text-xl font-bold font-mono">{complaint.referenceNumber}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={complaint.status} className="text-sm px-3 py-1" />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg mb-1">{complaint.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-3">{complaint.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Category</p>
                  <p className="font-medium text-gray-700 capitalize">{complaint.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Priority</p>
                  <PriorityBadge priority={complaint.priority} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Department</p>
                  <p className="font-medium text-gray-700">{complaint.department}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Location</p>
                  <p className="font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {complaint.location.address}, {complaint.location.district}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Filed On</p>
                  <p className="font-medium text-gray-700">{formatDate(complaint.createdAt)}</p>
                </div>
              </div>

              {/* Progress stepper */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Progress</p>
                <div className="flex items-center gap-0">
                  {statusSteps.map((step, i) => {
                    const done = i <= currentStepIndex
                    const active = i === currentStepIndex
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                            done ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                          }`}>
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-white" />
                              : <span className="w-2 h-2 bg-gray-300 rounded-full" />
                            }
                          </div>
                          <p className={`mt-1 text-xs text-center capitalize leading-tight max-w-[60px] ${
                            active ? 'text-blue-600 font-semibold' : done ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {step.replace('_', ' ')}
                          </p>
                        </div>
                        {i < statusSteps.length - 1 && (
                          <div className={`flex-1 h-0.5 -mt-5 mx-1 ${i < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Activity Timeline
                </p>
                <div className="space-y-3">
                  {complaint.timeline.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 shrink-0" />
                        <div className="w-px flex-1 bg-gray-200 mt-1" />
                      </div>
                      <div className="pb-3 flex-1">
                        <p className="text-sm text-gray-700">{item.note}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={item.status} />
                          <span className="text-xs text-gray-400">{formatDateTime(item.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution / Due date */}
              {complaint.resolvedAt && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700">
                    Resolved on <strong>{formatDate(complaint.resolvedAt)}</strong>
                    {complaint.satisfactionRating && ` · Citizen rated ${complaint.satisfactionRating}/5 ⭐`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help prompt */}
        {!complaint && !loading && (
          <p className="text-center text-sm text-gray-400 mt-8">
            Don't have a reference number?{' '}
            <a href="/login" className="text-blue-600 hover:underline">Login to file a new complaint</a>
          </p>
        )}
      </div>
    </div>
  )
}
