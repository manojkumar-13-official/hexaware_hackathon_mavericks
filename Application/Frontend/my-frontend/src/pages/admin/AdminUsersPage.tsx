import React, { useState, useEffect, useCallback } from 'react'
import { UserPlus, MoreHorizontal, Mail, Phone, RefreshCw, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable, SearchFilterBar, Pagination, ConfirmDialog, ListSkeleton } from '@/components/shared'
import type { Column } from '@/components/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getInitials, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { complaintsApi } from '@/api/complaints.api'
import type { User, Complaint } from '@/types'

// ─── types ──────────────────────────────────────────────────
interface ProfileRow {
  id:         string
  name:       string
  email:      string
  phone?:     string
  role:       string
  department?: string
  badge?:     string
  is_active:  boolean
  created_at: string
}

interface AssignDialogState {
  open:       boolean
  complaint:  Complaint | null
  officerId:  string
}

// ─── constants ──────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: 'citizen',     label: 'Citizen'      },
  { value: 'call_center', label: 'Call Center'  },
  { value: 'officer',     label: 'Officer'      },
  { value: 'admin',       label: 'Admin'        },
]

const ROLE_BADGE: Record<string, 'default' | 'secondary' | 'success' | 'destructive'> = {
  citizen:     'secondary',
  call_center: 'default',
  officer:     'success',
  admin:       'destructive',
}

export default function AdminUsersPage() {
  const [users, setUsers]           = useState<ProfileRow[]>([])
  const [officers, setOfficers]     = useState<ProfileRow[]>([])
  const [unassigned, setUnassigned] = useState<Complaint[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch]         = useState('')
  const [filters, setFilters]       = useState<Record<string, string[]>>({})
  const [page, setPage]             = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null)
  const [assignDialog, setAssignDialog] = useState<AssignDialogState>({
    open: false, complaint: null, officerId: '',
  })
  const PAGE_SIZE = 15

  const loadData = useCallback(async () => {
    try {
      // Load profiles from Supabase
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      setUsers(profileData as ProfileRow[] ?? [])
      setOfficers((profileData as ProfileRow[] ?? []).filter(p => p.role === 'officer' && p.is_active))

      // Load unassigned complaints
      const { data: unasData } = await supabase
        .from('complaints')
        .select('*')
        .is('assigned_officer_id', null)
        .not('status', 'in', '("resolved","closed","rejected")')
        .order('created_at', { ascending: false })
        .limit(20)
      if (unasData) {
        setUnassigned(unasData.map(r => ({
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to load users: ${msg}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Filter + paginate client-side
  const filtered = users.filter(u => {
    const matchSearch = !search
      || u.name.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !filters.role?.length || filters.role.includes(u.role)
    return matchSearch && matchRole
  })
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Deactivate user
  const handleDeactivate = async (target: ProfileRow) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', target.id)
      if (error) throw new Error(error.message)
      setUsers(prev => prev.map(u => u.id === target.id ? { ...u, is_active: false } : u))
      toast.success(`${target.name} deactivated`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate user')
    }
    setDeleteTarget(null)
  }

  // Reactivate user
  const handleReactivate = async (target: ProfileRow) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', target.id)
      if (error) throw new Error(error.message)
      setUsers(prev => prev.map(u => u.id === target.id ? { ...u, is_active: true } : u))
      toast.success(`${target.name} reactivated`)
    } catch { toast.error('Failed to reactivate') }
  }

  // Assign complaint to officer
  const handleAssignSubmit = async () => {
    if (!assignDialog.complaint || !assignDialog.officerId) return
    try {
      await complaintsApi.assign(assignDialog.complaint.id, assignDialog.officerId)
      setUnassigned(prev => prev.filter(c => c.id !== assignDialog.complaint!.id))
      toast.success(`Complaint ${assignDialog.complaint.referenceNumber} assigned`)
      setAssignDialog({ open: false, complaint: null, officerId: '' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Assignment failed')
    }
  }

  // Table columns
  const columns: Column<ProfileRow>[] = [
    {
      key: 'name',
      header: 'User',
      accessor: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
              {getInitials(u.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-gray-900">{u.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Mail className="w-3 h-3" />{u.email}
            </p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (u) => (
        <Badge variant={ROLE_BADGE[u.role] ?? 'secondary'} className="capitalize">
          {u.role.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      accessor: (u) => <span className="text-sm text-gray-600">{u.department ?? '—'}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      accessor: (u) => (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          {u.phone ? <><Phone className="w-3 h-3" />{u.phone}</> : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (u) => (
        <span className={`text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-gray-400'}`}>
          {u.is_active ? '● Active' : '○ Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      accessor: (u) => <span className="text-xs text-gray-400">{formatDate(u.created_at)}</span>,
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      accessor: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="User actions">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {u.is_active
              ? <DropdownMenuItem destructive onClick={() => setDeleteTarget(u)}>Deactivate</DropdownMenuItem>
              : <DropdownMenuItem onClick={() => handleReactivate(u)}>Reactivate</DropdownMenuItem>
            }
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info('Role management coming soon')}>
              Change Role
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: 'w-10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">{users.length} users · {officers.length} active officers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); loadData() }} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => toast.info('Invite flow coming soon')}>
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        </div>
      </div>

      {/* Unassigned complaints banner */}
      {unassigned.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              {unassigned.length} complaint{unassigned.length > 1 ? 's' : ''} need officer assignment
            </span>
          </div>
          <div className="space-y-2">
            {unassigned.slice(0, 3).map(c => (
              <div key={c.id}
                className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-3 py-2 gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.referenceNumber} · {c.department}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={
                    (c.priority === 'critical' ? 'destructive'
                    : c.priority === 'high' ? 'warning' : 'default') as never
                  } className="capitalize text-xs">{c.priority}</Badge>
                  <Button size="sm" className="h-6 text-xs px-2"
                    onClick={() => setAssignDialog({ open: true, complaint: c, officerId: '' })}>
                    Assign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <SearchFilterBar
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search by name or email…"
        filterGroups={[{ key: 'role', label: 'Role', options: ROLE_OPTIONS }]}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
        onClearFilters={() => setFilters({})}
      />

      {/* Table */}
      {loading ? <ListSkeleton rows={8} /> : (
        <DataTable
          columns={columns}
          data={paged}
          keyExtractor={u => u.id}
          emptyTitle="No users found"
          emptyDescription="Try adjusting your search or filters"
          stickyHeader
        />
      )}

      <Pagination
        meta={{ page, pageSize: PAGE_SIZE, total: filtered.length, totalPages }}
        onPageChange={setPage}
      />

      {/* Deactivate confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={`Deactivate ${deleteTarget?.name}?`}
        description="This will disable the user's access. You can reactivate them from the same menu."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => { if (deleteTarget) void handleDeactivate(deleteTarget) }}
      />

      {/* Assign officer dialog */}
      <Dialog
        open={assignDialog.open}
        onOpenChange={open => setAssignDialog(p => ({ ...p, open, officerId: open ? p.officerId : '' }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Officer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {assignDialog.complaint && (
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <p className="font-medium text-gray-900">{assignDialog.complaint.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {assignDialog.complaint.referenceNumber} · {assignDialog.complaint.department}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Select Officer</label>
              <Select
                value={assignDialog.officerId}
                onValueChange={v => setAssignDialog(p => ({ ...p, officerId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an officer…" />
                </SelectTrigger>
                <SelectContent>
                  {officers.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-400">No active officers found</div>
                  ) : officers.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name} {o.department ? `· ${o.department}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, complaint: null, officerId: '' })}>
              Cancel
            </Button>
            <Button onClick={handleAssignSubmit} disabled={!assignDialog.officerId}>
              Assign Officer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
