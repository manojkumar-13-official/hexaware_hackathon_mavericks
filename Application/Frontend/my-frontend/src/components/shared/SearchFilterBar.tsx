import React from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterGroup {
  key: string
  label: string
  options: FilterOption[]
  multiple?: boolean
}

interface SearchFilterBarProps {
  searchValue: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  filterGroups?: FilterGroup[]
  activeFilters?: Record<string, string[]>
  onFilterChange?: (key: string, values: string[]) => void
  onClearFilters?: () => void
  rightSlot?: React.ReactNode
  className?: string
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filterGroups = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  rightSlot,
  className,
}: SearchFilterBarProps) {
  const totalActive = Object.values(activeFilters).reduce((acc, arr) => acc + arr.length, 0)

  const handleCheckbox = (groupKey: string, value: string, checked: boolean) => {
    if (!onFilterChange) return
    const current = activeFilters[groupKey] ?? []
    if (checked) {
      onFilterChange(groupKey, [...current, value])
    } else {
      onFilterChange(groupKey, current.filter(v => v !== value))
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Search input */}
      <div className="flex-1 min-w-[200px] max-w-sm">
        <Input
          leftIcon={<Search className="w-4 h-4" />}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search"
        />
      </div>

      {/* Filter dropdowns */}
      {filterGroups.map((group) => {
        const active = activeFilters[group.key] ?? []
        return (
          <DropdownMenu key={group.key}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(active.length > 0 && 'border-blue-500 bg-blue-50 text-blue-700')}
              >
                <Filter className="w-3.5 h-3.5" />
                {group.label}
                {active.length > 0 && (
                  <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {active.length}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {group.options.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={active.includes(opt.value)}
                  onCheckedChange={(checked) => handleCheckbox(group.key, opt.value, checked)}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })}

      {/* Active filter chips */}
      {totalActive > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.entries(activeFilters).map(([key, values]) =>
            values.map((val) => {
              const group = filterGroups.find(g => g.key === key)
              const opt = group?.options.find(o => o.value === val)
              return (
                <span
                  key={`${key}-${val}`}
                  className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                >
                  {opt?.label ?? val}
                  <button
                    onClick={() => handleCheckbox(key, val, false)}
                    className="hover:text-blue-900 focus:outline-none"
                    aria-label={`Remove filter ${opt?.label ?? val}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })
          )}
          <button
            onClick={onClearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline focus:outline-none"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Right slot for custom buttons (export, add, etc.) */}
      {rightSlot && <div className="ml-auto">{rightSlot}</div>}
    </div>
  )
}
