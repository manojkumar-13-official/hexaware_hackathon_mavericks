import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Upload, Brain, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/shared'
import type { NewComplaintForm } from '@/types'

const CATEGORIES = [
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'roads', label: 'Roads & Footpaths' },
  { value: 'sanitation', label: 'Sanitation & Garbage' },
  { value: 'public_safety', label: 'Public Safety' },
  { value: 'noise', label: 'Noise Pollution' },
  { value: 'encroachment', label: 'Encroachment' },
  { value: 'taxation', label: 'Taxation' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'other', label: 'Other' },
]

const DISTRICTS = ['Central', 'North', 'South', 'East', 'West', 'Northeast', 'Southeast']

export default function NewComplaintPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{
    category: string; department: string; confidence: number
  } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm<NewComplaintForm>({
    defaultValues: { category: 'other', district: 'Central' },
  })

  const descriptionValue = watch('description')

  // AI_HOOK: Auto-categorize complaint from description text
  const handleAISuggest = async () => {
    if (!descriptionValue?.trim()) return
    setAiLoading(true)
    // AI_HOOK: Replace with aiApi.categorize(descriptionValue)
    await new Promise(r => setTimeout(r, 800))
    setAiSuggestion({ category: 'roads', department: 'Public Works', confidence: 0.91 })
    setAiLoading(false)
  }

  const applyAISuggestion = () => {
    if (!aiSuggestion) return
    setValue('category', aiSuggestion.category as NewComplaintForm['category'])
    toast.success('AI suggestion applied')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? [])
    setFiles(prev => [...prev, ...newFiles].slice(0, 5)) // max 5 files
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: NewComplaintForm) => {
    setSubmitting(true)
    // BACKEND_HOOK: Replace with complaintsApi.create({ ...data, attachments: files })
    await new Promise(r => setTimeout(r, 1000))
    const fakeRef = `GRV-2024-${String(Math.floor(Math.random() * 90000) + 10000)}`
    toast.success(`Complaint filed! Reference: ${fakeRef}`)
    setSubmitting(false)
    navigate('/citizen/history')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">File a New Complaint</h1>
        <p className="text-sm text-gray-500 mt-1">All fields marked * are required</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-5">
          {/* Title */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Complaint Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <Input
                  id="title"
                  placeholder="Brief title of your complaint"
                  error={errors.title?.message}
                  {...register('title', { required: 'Title is required', minLength: { value: 10, message: 'At least 10 characters' } })}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail…"
                  rows={4}
                  error={errors.description?.message}
                  {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'At least 20 characters' } })}
                />
                {/* AI auto-categorize */}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAISuggest}
                    disabled={!descriptionValue || descriptionValue.length < 20 || aiLoading}
                    className="text-purple-700 border-purple-200 hover:bg-purple-50"
                  >
                    {aiLoading
                      ? <Spinner size="sm" />
                      : <Brain className="w-3.5 h-3.5 text-purple-600" />
                    }
                    {/* AI_HOOK: Auto-categorize */}
                    AI Suggest Category
                  </Button>

                  {aiSuggestion && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-lg">
                      <Brain className="w-3 h-3 text-purple-600" />
                      <span>
                        <strong>{aiSuggestion.department}</strong> · {(aiSuggestion.confidence * 100).toFixed(0)}% confident
                      </span>
                      <button type="button" onClick={applyAISuggestion} className="text-purple-700 hover:underline font-medium">
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <Select
                    onValueChange={(v) => setValue('category', v as NewComplaintForm['category'])}
                    defaultValue="other"
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700">
                    Sub-category
                  </label>
                  <Input
                    id="subCategory"
                    placeholder="Optional"
                    {...register('subCategory')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <Input
                  id="address"
                  placeholder="Street address, landmark"
                  error={errors.address?.message}
                  {...register('address', { required: 'Address is required' })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
                    Ward
                  </label>
                  <Input id="ward" placeholder="e.g. Ward 12" {...register('ward')} />
                </div>

                <div className="space-y-1">
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                    District *
                  </label>
                  <Select
                    onValueChange={(v) => setValue('district', v)}
                    defaultValue="Central"
                  >
                    <SelectTrigger id="district">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                    Pincode
                  </label>
                  <Input id="pincode" placeholder="6-digit" {...register('pincode', {
                    pattern: { value: /^\d{6}$/, message: '6 digits only' }
                  })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Attachments (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload or drag &amp; drop</span>
                <span className="text-xs text-gray-400 mt-0.5">JPG, PNG, PDF up to 5MB each · Max 5 files</span>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  aria-label="Upload attachments"
                />
              </label>

              {files.length > 0 && (
                <ul className="mt-3 space-y-1.5" aria-label="Selected files">
                  {files.map((file, i) => (
                    <li key={i} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="truncate text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-gray-400 hover:text-red-500 ml-2 focus:outline-none"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => navigate('/citizen')}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              <CheckCircle className="w-4 h-4" />
              Submit Complaint
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
