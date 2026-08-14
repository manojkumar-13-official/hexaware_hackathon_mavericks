import React, { useState } from 'react'
import { UserPlus, MoreHorizontal, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable, SearchFilterBar, Pagination, ConfirmDialog } from '@/components/shared'
import type { Column } from '@/components/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { getInitials, formatDate } from '@/lib/utils'
import { MOCK_USERS } from '@/mock/authMock'
import type { User } from '@/types'

const ROLE_OPTIONS = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'call_center', label: 'Call Center' },
  { value: 'officer', label: 'Officer' },
  { value: 'admin', label: 'Admin' },
]

const ROLE_COLORS: Record<string, string> = {
  citizen: 'secondary',
  call_center: 'default',
  officer: 'success',
  admin: 'destructive',
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  // BACKEND_HOOK: usersApi.list({ search, role: filters.role, page })
  const users = MOCK_USERS.map(({ password: _pw, ...u }) => u)

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !filters.role?.length || filters.role.includes(u.role)
    return matchSearch && matchRole
  })

  const columns: Column<typeof users[0]>[] = [
    {
      key: 'name',
      header: 'User',
      accessor: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
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
        <Badge variant={(ROLE_COLORS[u.role] as 'default' | 'secondary' | 'success' | 'destructive') ?? 'secondary'} className="capitalize">
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
        <span className={`text-xs font-medium ${u.isActive ? 'text-green-600' : 'text-gray-400'}`}>
          {u.isActive ? '● Active' : '○ Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      accessor: (u) => <span className="text-xs text-gray-400">{formatDate(u.createdAt)}</span>,
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
            <DropdownMenuItem>Edit User</DropdownMenuItem>
            <DropdownMenuItem>Change Role</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => setDeleteTarget(u)}>
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: 'w-10',
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">{users.length} users registered</p>
        </div>
        <Button size="sm">
          <UserPlus className="w-4 h-4" /> Add User
        </Button>
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search by name or email…"
        filterGroups={[{ key: 'role', label: 'Role', options: ROLE_OPTIONS }]}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
        onClearFilters={() => setFilters({})}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={u => u.id}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your filters"
        stickyHeader
      />

      <Pagination
        meta={{ page, pageSize: 10, total: filtered.length, totalPages: Math.ceil(filtered.length / 10) }}
        onPageChange={setPage}
      />

      {/* Confirm deactivate */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={`Deactivate ${deleteTarget?.name}?`}
        description="This will disable the user's access. You can reactivate them later."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={async () => {
          // BACKEND_HOOK: usersApi.updateStatus(deleteTarget!.id, false)
          await new Promise(r => setTimeout(r, 500))
          toast.success(`${deleteTarget?.name} deactivated`)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
