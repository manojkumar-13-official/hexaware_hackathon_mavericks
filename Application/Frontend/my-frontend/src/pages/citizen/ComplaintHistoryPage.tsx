import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComplaintCard, SearchFilterBar, Pagination, ListSkeleton, EmptyState } from '@/components/shared'
import { getMockComplaints } from '@/mock/data'
import type { Complaint, PaginationMeta } from '@/types'

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'closed', label: 'Closed' },
]

export default function ComplaintHistoryPage() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 1 })

  useEffect(() => {
    setLoading(true)
    // BACKEND_HOOK: Replace with complaintsApi.getMyCcomplaints(userId, { search, ...filters, page })
    getMockComplaints(page, 10).then(res => {
      setComplaints(res.data)
      setMeta(res.meta)
      setLoading(false)
    })
  }, [page, search, filters])

  const filterGroups = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
  ]

  const handleFilterChange = (key: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }))
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-sm text-gray-500">Track all your filed grievances</p>
        </div>
        <Button size="sm" onClick={() => navigate('/citizen/new')}>
          <PlusCircle className="w-4 h-4" /> New Complaint
        </Button>
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search by title or reference…"
        filterGroups={filterGroups}
        activeFilters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No complaints found"
          description="Try adjusting your filters or file a new complaint."
          action={{ label: 'File New Complaint', onClick: () => navigate('/citizen/new') }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {complaints.map(c => (
              <ComplaintCard key={c.id} complaint={c} variant="citizen" />
            ))}
          </div>
          <Pagination
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        </>
      )}
    </div>
  )
}
