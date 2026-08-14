import React, { useEffect, useRef } from 'react'
import { cn, formatDuration } from '@/lib/utils'
import { SentimentBadge } from './StatusBadge'
import { Spinner } from './LoadingState'
import type { Transcript, TranscriptSegment } from '@/types'

interface TranscriptPanelProps {
  transcript?: Transcript
  isLoading?: boolean
  // WEBSOCKET_HOOK: pass liveSegments from WebSocket during active call
  liveSegments?: TranscriptSegment[]
  autoScroll?: boolean
  className?: string
}

export function TranscriptPanel({
  transcript,
  isLoading = false,
  liveSegments = [],
  autoScroll = true,
  className,
}: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const allSegments = [
    ...(transcript?.segments ?? []),
    ...liveSegments,
  ]

  // Auto-scroll to bottom when new live segments arrive
  useEffect(() => {
    if (autoScroll && liveSegments.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [liveSegments.length, autoScroll])

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-40', className)}>
        <Spinner label="Loading transcript…" />
      </div>
    )
  }

  if (!transcript && liveSegments.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-40 text-sm text-gray-400', className)}>
        No transcript available
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2 overflow-y-auto', className)} aria-label="Call transcript" aria-live="polite">
      {/* Header */}
      {transcript && (
        <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-100">
          <span>Duration: {formatDuration(transcript.totalDuration)}</span>
          <span>Language: {transcript.language.toUpperCase()}</span>
          {transcript.isStreaming && (
            <span className="flex items-center gap-1 text-green-600 font-medium animate-pulse">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              LIVE
            </span>
          )}
        </div>
      )}

      {/* Segments */}
      {allSegments.map((seg) => (
        <TranscriptSegmentItem key={seg.id} segment={seg} />
      ))}

      {/* Live typing indicator */}
      {transcript?.isStreaming && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          <span>Transcribing…</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

function TranscriptSegmentItem({ segment }: { segment: TranscriptSegment }) {
  const isCitizen = segment.speaker === 'citizen'
  const isSystem = segment.speaker === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full italic">
          {segment.text}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        isCitizen ? 'flex-row' : 'flex-row-reverse',
        segment.isLive && 'opacity-80'
      )}
    >
      {/* Speaker indicator */}
      <div className={cn(
        'w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold',
        isCitizen
          ? 'bg-blue-100 text-blue-700'
          : 'bg-purple-100 text-purple-700'
      )}>
        {segment.speakerName[0]}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[75%] flex flex-col', isCitizen ? 'items-start' : 'items-end')}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-gray-600">{segment.speakerName}</span>
          <span className="text-xs text-gray-400">{formatDuration(Math.floor(segment.startTime))}</span>
          {segment.sentiment && segment.sentiment !== 'neutral' && (
            <SentimentBadge sentiment={segment.sentiment} className="text-xs py-0" />
          )}
        </div>

        <div className={cn(
          'px-3 py-2 rounded-xl text-sm',
          isCitizen
            ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
            : 'bg-blue-600 text-white rounded-tr-sm'
        )}>
          {segment.text}
        </div>

        {/* Confidence indicator for low-confidence ASR */}
        {segment.confidence < 0.8 && (
          <span className="text-xs text-yellow-600 mt-0.5">
            Low confidence ({(segment.confidence * 100).toFixed(0)}%)
          </span>
        )}
      </div>
    </div>
  )
}
