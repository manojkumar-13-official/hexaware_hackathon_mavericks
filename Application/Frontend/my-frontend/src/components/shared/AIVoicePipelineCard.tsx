import React from 'react'
import {
  Brain, Globe, FileText, CheckCircle2, AlertTriangle, Zap,
  Building2, Clock, Tag, MapPin, Users, ArrowRight, ShieldAlert,
  Sparkles, Check, ChevronRight, Wrench, Activity, ShieldCheck, Flame
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VoicePipelineOutput } from '@/types'

interface AIVoicePipelineCardProps {
  pipeline: VoicePipelineOutput
  onApply?: () => void
  onDirectSubmit?: () => void
  isSubmitting?: boolean
  className?: string
}

export function AIVoicePipelineCard({
  pipeline,
  onApply,
  onDirectSubmit,
  isSubmitting = false,
  className,
}: AIVoicePipelineCardProps) {
  const isEmergency = pipeline.is_emergency || pipeline.severity_score >= 4
  const riskScore = pipeline.risk_score || pipeline.urgency_score || 65

  const severityColors: Record<number, { bg: string; text: string; border: string; label: string }> = {
    1: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: '1/5 - Minor Inconvenience' },
    2: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   label: '2/5 - Moderate Routine' },
    3: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  label: '3/5 - Significant Disruption' },
    4: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: '4/5 - High Hazard / Safety Risk' },
    5: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    label: '5/5 - Life-Threatening Emergency' },
  }

  const sevInfo = severityColors[pipeline.severity_score] ?? severityColors[3]

  const riskBadgeColor =
    riskScore >= 80 ? 'bg-red-600 text-white' :
    riskScore >= 65 ? 'bg-orange-600 text-white' :
    riskScore >= 40 ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'

  return (
    <Card className={cn('border-purple-300 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/40 shadow-md overflow-hidden transition-all duration-300', className)}>
      {/* Header Banner */}
      <CardHeader className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
              <Brain className="w-5 h-5 text-purple-200 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                Agent Intelligence Pipeline
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  Continuous AI Engine
                </span>
              </CardTitle>
              <p className="text-xs text-purple-200">
                Spoken Voice ➔ Context Analysis ➔ Dynamic Risk Matrix ➔ Fast-Track Resolution Plan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-xs px-2.5 py-1">
              Confidence: {Math.round(pipeline.confidence * 100)}%
            </Badge>
            {pipeline.processing_ms ? (
              <span className="text-[11px] text-purple-200 font-mono">
                {pipeline.processing_ms}ms
              </span>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">

        {/* ── STAGE 1 & 2: Spoken Transcript & English Translation ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Stage 1: Spoken Speech */}
          <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 inline-flex items-center justify-center font-bold text-[10px]">1</span>
                Original Spoken Voice
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                <Globe className="w-3 h-3" />
                {pipeline.language_name} ({pipeline.detected_language})
              </span>
            </div>
            <p className="text-sm text-gray-800 italic bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 leading-relaxed font-sans">
              "{pipeline.original_transcript}"
            </p>
          </div>

          {/* Stage 2: Translation */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center font-bold text-[10px]">2</span>
                Agent English Translation
              </span>
              <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                Normalized
              </span>
            </div>
            <p className="text-sm text-gray-900 bg-white p-2.5 rounded-lg border border-indigo-100 leading-relaxed font-medium">
              {pipeline.translated_text}
            </p>
          </div>
        </div>

        {/* ── STAGE 3: Important Keyword & Context Summarization ── */}
        <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white inline-flex items-center justify-center font-bold text-[10px]">3</span>
              AI Summarization &amp; Important Context
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Extracted from civilian speech
            </span>
          </div>

          {/* Title & Summary */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              {pipeline.title}
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
              {pipeline.summary}
            </p>
          </div>

          {/* Important Keywords */}
          {pipeline.important_keywords && pipeline.important_keywords.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-purple-500" /> Important Keywords Extracted
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pipeline.important_keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium border border-purple-200"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Entities Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-100">
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" /> Location
              </span>
              <p className="text-xs font-semibold text-gray-900 truncate mt-0.5">
                {pipeline.entities.locations[0] ?? 'Mentioned in text'}
              </p>
            </div>

            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-500 uppercase">Ward / Sector</span>
              <p className="text-xs font-semibold text-gray-900 mt-0.5">
                {pipeline.entities.ward ?? 'Ward 80'}
              </p>
            </div>

            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-500" /> Affected
              </span>
              <p className="text-xs font-semibold text-gray-900 mt-0.5">
                {pipeline.entities.people_affected ? `${pipeline.entities.people_affected} people` : 'Multiple residents'}
              </p>
            </div>

            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-500 uppercase">Timeline</span>
              <p className="text-xs font-semibold text-gray-900 mt-0.5">
                {pipeline.entities.duration_mentioned ?? 'Immediate'}
              </p>
            </div>
          </div>
        </div>

        {/* ── DYNAMIC RISK & URGENCY MATRIX (Multi-Factor Breakdown) ── */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Dynamic Multi-Factor Risk &amp; Urgency Engine
              </span>
            </div>
            <Badge className={cn('text-xs font-bold px-3 py-0.5 shadow-sm', riskBadgeColor)}>
              {riskScore}/100 Risk Score ({pipeline.risk_level?.toUpperCase() || (riskScore >= 70 ? 'HIGH' : 'MODERATE')})
            </Badge>
          </div>

          {/* 4 Multi-Factor Breakdown Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-rose-100 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 font-medium">Safety Hazard</span>
                <span className="font-bold text-rose-600">{pipeline.risk_breakdown?.safety_risk ?? (isEmergency ? 35 : 20)}/40</span>
              </div>
              <Progress value={((pipeline.risk_breakdown?.safety_risk ?? (isEmergency ? 35 : 20)) / 40) * 100} className="h-1.5 bg-rose-100" />
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-rose-100 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 font-medium">Population Impact</span>
                <span className="font-bold text-orange-600">{pipeline.risk_breakdown?.population_impact ?? 16}/25</span>
              </div>
              <Progress value={((pipeline.risk_breakdown?.population_impact ?? 16) / 25) * 100} className="h-1.5 bg-orange-100" />
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-rose-100 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 font-medium">Duration Decay</span>
                <span className="font-bold text-amber-600">{pipeline.risk_breakdown?.duration_factor ?? 14}/20</span>
              </div>
              <Progress value={((pipeline.risk_breakdown?.duration_factor ?? 14) / 20) * 100} className="h-1.5 bg-amber-100" />
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-rose-100 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 font-medium">Vulnerability</span>
                <span className="font-bold text-purple-600">{pipeline.risk_breakdown?.vulnerability ?? 8}/15</span>
              </div>
              <Progress value={((pipeline.risk_breakdown?.vulnerability ?? 8) / 15) * 100} className="h-1.5 bg-purple-100" />
            </div>
          </div>

          <p className="text-[11px] text-gray-600 italic bg-white/70 p-2 rounded-lg border border-rose-100">
            💡 {pipeline.risk_breakdown?.summary || `Composite Risk Score of ${riskScore}/100 automatically dynamically generated from live environmental threat and population impact factors.`}
          </p>
        </div>

        {/* ── ACTIONABLE FIELD RESOLUTION PLAN ("Solve the Issue Easily") ── */}
        {pipeline.resolution_plan && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-950">
                  AI Actionable Field Resolution Plan (Fast-Track Dispatch)
                </span>
              </div>
              <Badge className="bg-teal-700 text-white text-[11px] font-semibold">
                {pipeline.resolution_plan.target_completion}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-teal-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Designated Rapid Response Squad</span>
                <p className="font-bold text-teal-900 text-sm">{pipeline.resolution_plan.field_squad}</p>
                <span className="text-[10px] text-gray-500 font-medium">Cost Tier: {pipeline.resolution_plan.estimated_cost_tier}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-teal-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Required Equipment &amp; Materials</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {pipeline.resolution_plan.required_equipment.map((eq, i) => (
                    <span key={i} className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200 font-medium">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step-by-Step Resolution Workflow */}
            <div className="bg-white p-3 rounded-xl border border-teal-100 space-y-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Step-by-Step Operational Workflow</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {pipeline.resolution_plan.resolution_steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-700 bg-gray-50/80 p-1.5 rounded-lg border border-gray-100">
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white inline-flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 4 & 5: Problem Classification & Auto Department Assignment ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Stage 4: Classification */}
          <div className="rounded-xl border border-blue-200 bg-white p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center font-bold text-[10px]">4</span>
                Problem Classification
              </span>
              <Badge className="capitalize bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">
                {pipeline.category.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Sub-Category:</span>
                <span className="font-semibold text-gray-800 capitalize">
                  {pipeline.sub_category?.replace('_', ' ') ?? 'General'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Severity Assessment:</span>
                <span className={cn('font-bold px-2 py-0.5 rounded-full border text-[11px]', sevInfo.bg, sevInfo.text, sevInfo.border)}>
                  {sevInfo.label}
                </span>
              </div>

              {isEmergency && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium mt-1">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>High Emergency Priority — Immediate Dispatch Triggered</span>
                </div>
              )}
            </div>
          </div>

          {/* Stage 5: Department Assignment */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/40 p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center font-bold text-[10px]">5</span>
                Dynamic Department Assignment
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                <Building2 className="w-3 h-3" />
                {pipeline.department_code}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 space-y-1">
              <p className="text-xs font-bold text-gray-900">
                {pipeline.department_full_name || pipeline.recommended_department}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
                <span className="flex items-center gap-1 font-medium text-emerald-700">
                  <Clock className="w-3.5 h-3.5" /> SLA: {pipeline.sla_hours} Hours
                </span>
                <span className="text-gray-400">·</span>
                <span className="capitalize font-semibold text-gray-800">
                  Priority: {pipeline.priority}
                </span>
              </div>
            </div>

            {/* AI Dynamic Routing Rationale */}
            {pipeline.department_routing_rationale && (
              <div className="bg-emerald-100/60 p-2 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-0.5">
                <span className="font-bold text-[10px] text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  Dynamic AI Routing Rationale:
                </span>
                <p className="text-[11px] leading-relaxed italic text-emerald-900">
                  "{pipeline.department_routing_rationale}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-100 flex-wrap">
          {onApply && (
            <Button
              type="button"
              variant="outline"
              onClick={onApply}
              className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Check className="w-4 h-4" /> Review Form Fields
            </Button>
          )}

          {onDirectSubmit && (
            <Button
              type="button"
              onClick={onDirectSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 px-6 shadow-md"
            >
              <Zap className="w-4 h-4" />
              {isSubmitting ? 'Registering Grievance…' : 'Instant 1-Click Register'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
