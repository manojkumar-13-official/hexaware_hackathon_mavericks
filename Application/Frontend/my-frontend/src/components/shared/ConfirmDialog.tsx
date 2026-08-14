import React from 'react'
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type DialogVariant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: DialogVariant
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const iconMap = {
    danger: <Trash2 className="w-5 h-5 text-red-600" aria-hidden="true" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" aria-hidden="true" />,
    info: <CheckCircle className="w-5 h-5 text-blue-600" aria-hidden="true" />,
  }

  const bgMap = {
    danger: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50',
  }

  const btnVariantMap: Record<DialogVariant, 'destructive' | 'warning' | 'default'> = {
    danger: 'destructive',
    warning: 'warning',
    info: 'default',
  }

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className={`w-10 h-10 rounded-full ${bgMap[variant]} flex items-center justify-center mb-3`}>
            {iconMap[variant]}
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={btnVariantMap[variant]}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
