import React, { useState } from 'react'
import { Brain, ChevronDown, ChevronUp, Zap, MapPin, Tag, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SentimentBadge } from './StatusBadge'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PriorityBadge } from './StatusBadge'
import type { AIInsights } from '@/types'

interface AIInsightCardProps {
  insights: AIInsights
  defaultExpanded?: boolean
  className?: string
}

// AI_HOOK: This component renders output from the AI/NLP microservice
export function AIInsightCard({ insights, defaultExpanded = true, className }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <Card className={cn('border-purple-200 bg-purple-50/30', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm text-purple-800">
            <Brain className="w-4 h-4 text-purple-600" aria-hidden="true" />
            AI Analysis
            <span className="text-xs font-normal text-purple-500">· {insights.modelVersion}</span>
          </CardTitle>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded hover:bg-purple-100 text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse AI insights' : 'Expand AI insights'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Summary */}
          {/* AI_HOOK: NLP-generated complaint summary */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
            <p className="text-sm text-gray-700 leading-relaxed">{insights.summary}</p>
          </div>

          {/* Sentiment + Urgency */}
          <div className="flex flex-wrap items-center gap-3">
            {/* AI_HOOK: Sentiment from NLP microservice */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Sentiment</p>
              <SentimentBadge sentiment={insights.sentiment} score={insights.sentimentScore} />
            </div>
            <div className="flex-1 min-w-[120px]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-500">Urgency</p>
                <span className={cn(
                  'text-xs font-bold',
                  insights.urgencyScore >= 80 ? 'text-red-600' :
                  insights.urgencyScore >= 60 ? 'text-orange-600' : 'text-yellow-600'
                )}>
                  {insights.urgencyScore}/100
                </span>
              </div>
              <Progress
                value={insights.urgencyScore}
                className={cn(
                  'h-2',
                  insights.urgencyScore >= 80 ? '[&>div]:bg-red-500' :
                  insights.urgencyScore >= 60 ? '[&>div]:bg-orange-500' : '[&>div]:bg-yellow-500'
                )}
              />
            </div>
          </div>

          {/* Detected topics */}
          {insights.detectedTopics.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" />Topics Detected
              </p>
              <div className="flex flex-wrap gap-1.5">
                {insights.detectedTopics.map((topic) => (
                  <span key={topic} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Named entities */}
          {/* AI_HOOK: Named Entity Recognition (NER) output */}
          {insights.entities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />Entities Detected
              </p>
              <div className="flex flex-wrap gap-1.5">
                {insights.entities.map((entity, i) => (
                  <span
                    key={i}
                    className="text-xs border border-gray-200 bg-white px-2 py-0.5 rounded"
                    title={`${entity.type} (${(entity.confidence * 100).toFixed(0)}% confidence)`}
                  >
                    <span className="text-gray-400 text-xs uppercase mr-1">{entity.type}:</span>
                    {entity.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested actions */}
          {/* AI_HOOK: Action suggestions from AI routing model */}
          {insights.suggestedActions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                Suggested Actions
              </p>
              <div className="space-y-2">
                {insights.suggestedActions.map((action) => (
                  <div key={action.id} className="flex items-start justify-between gap-2 bg-white border border-gray-200 rounded-lg p-2.5">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{action.action}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">{action.department}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">~{action.estimatedResolutionDays}d</span>
                        <span className="text-xs text-green-600">
                          {(action.confidence * 100).toFixed(0)}% confident
                        </span>
                      </div>
                    </div>
                    <PriorityBadge priority={action.priority} className="shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions */}
          {(insights.predictedCategory || insights.predictedDepartment) && (
            <div className="flex flex-wrap gap-4 pt-2 border-t border-purple-100">
              {insights.predictedCategory && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Predicted Category</p>
                  <span className="text-xs font-medium text-gray-700 capitalize bg-gray-100 px-2 py-0.5 rounded">
                    {insights.predictedCategory.replace('_', ' ')}
                  </span>
                </div>
              )}
              {insights.predictedDepartment && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Predicted Department</p>
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {insights.predictedDepartment}
                  </span>
                </div>
              )}
              {insights.detectedLanguage && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Language</p>
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded uppercase">
                    {insights.detectedLanguage}
                  </span>
                </div>
              )}
            </div>
          )}

          {insights.urgencyScore >= 80 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
              <p className="text-xs text-red-700 font-medium">
                High urgency detected — recommend immediate escalation
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
