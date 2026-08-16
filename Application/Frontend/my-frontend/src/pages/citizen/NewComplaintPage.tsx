import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Upload, Brain, CheckCircle, X, Mic, MicOff, FileText,
  Square, Play, Pause, Trash2, AudioLines, Globe,
  AlertTriangle, Zap, Sparkles, Building2, Clock, Check,
  ChevronDown, ChevronUp, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner, AIVoicePipelineCard } from '@/components/shared'
import { complaintsApi } from '@/api/complaints.api'
import { aiApi } from '@/api/ai.api'
import type { NewComplaintForm, VoicePipelineOutput, ComplaintCategory } from '@/types'

// ─────────────────────────────────────────────
// Constants & Configuration
// ─────────────────────────────────────────────

const CATEGORIES = [
  { value: 'water_supply',  label: 'Water Supply & Drainage' },
  { value: 'electricity',   label: 'Electricity & Power Grid' },
  { value: 'roads',         label: 'Roads & Infrastructure'   },
  { value: 'sanitation',    label: 'Sanitation & Solid Waste' },
  { value: 'public_safety', label: 'Public Safety & Emergency' },
  { value: 'healthcare',    label: 'Public Health & Epidemic' },
  { value: 'noise',         label: 'Noise & Environment'      },
  { value: 'encroachment',  label: 'Land Encroachment'        },
  { value: 'taxation',      label: 'Revenue & Taxation'       },
  { value: 'other',         label: 'General Administration'   },
]

const DISTRICTS = ['Central', 'North', 'South', 'East', 'West', 'Northeast', 'Southeast']

const SPEECH_LANGUAGES = [
  { code: 'ta-IN', label: 'Tamil (தமிழ்)'      },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)'      },
  { code: 'en-IN', label: 'English (India)'    },
  { code: 'te-IN', label: 'Telugu (తెలుగు)'     },
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)'    },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)'    },
  { code: 'bn-IN', label: 'Bengali (বাংলা)'    },
  { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)' },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)'   },
  { code: 'ur-IN', label: 'Urdu (اردو)'        },
]

const DEMO_VOICE_PRESETS = [
  {
    id: 'ta_elec',
    lang: 'ta-IN',
    langLabel: 'Tamil ➔ Electricity',
    dept: 'Electricity Board (ELEC)',
    icon: '⚡',
    title: 'Transformer Spark (Tamil)',
    text: 'மெயின் ரோட்டில் உள்ள மின்சார டிரான்ஸ்பார்மரில் தீப்பொறி பறக்கிறது, 2 நாட்களாக மின்சாரம் துண்டிக்கப்பட்டுள்ளது.',
  },
  {
    id: 'ta_road',
    lang: 'ta-IN',
    langLabel: 'Tamil ➔ Roads (PWD)',
    dept: 'Public Works (PWD)',
    icon: '🛣️',
    title: 'Road Potholes (Tamil)',
    text: 'அண்ணா நகர் மெயின் ரோட்டில் பெரிய பள்ளம் ஏற்பட்டு வாகனங்கள் விபத்துக்குள்ளாகின்றன. உடனடியாக தார் போட வேண்டும்.',
  },
  {
    id: 'hi_water',
    lang: 'hi-IN',
    langLabel: 'Hindi ➔ Water Supply',
    dept: 'Water Supply (WSD)',
    icon: '💧',
    title: 'Water Outage (Hindi)',
    text: 'हमारे इलाके गांधी नगर में पिछले 3 दिन से पीने के पानी की सप्लाई बंद है और पाइपलाइन से गंदा पानी आ रहा है।',
  },
  {
    id: 'hi_sanit',
    lang: 'hi-IN',
    langLabel: 'Hindi ➔ Sanitation',
    dept: 'Sanitation & Waste (SWM)',
    icon: '🚯',
    title: 'Garbage Overflow (Hindi)',
    text: 'मार्केट के सामने कचरे का ढेर लगा है और नालियां चोक हो गई हैं, बहुत बदबू आ रही है और मक्खियां फैल रही हैं।',
  },
  {
    id: 'te_fire',
    lang: 'te-IN',
    langLabel: 'Telugu ➔ Emergency Fire',
    dept: 'Public Safety (Police)',
    icon: '🚨',
    title: 'Fire Hazard (Telugu)',
    text: 'గాంధీ నగర్ బజార్‌లో వాణిజ్య భవనంలో భారీ అగ్నిప్రమాదం జరిగింది. వెంటనే ఫైర్ ఇంజిన్ మరియు సహాయక బృందాన్ని పంపించండి!',
  },
  {
    id: 'kn_health',
    lang: 'kn-IN',
    langLabel: 'Kannada ➔ Health / Dengue',
    dept: 'Health Department (HLTH)',
    icon: '🩺',
    title: 'Dengue Mosquito (Kannada)',
    text: 'ನಮ್ಮ ವಾರ್ಡ್ 12 ರಲ್ಲಿ ಡೆಂಗ್ಯೂ ಜ್ವರ ಮತ್ತು ಸೊಳ್ಳೆಗಳ ಕಾಟ ಹೆಚ್ಚಾಗಿದ್ದು, ತಕ್ಷಣ ಸೊಳ್ಳೆ ನಿಯಂತ್ರಣ ಔಷಧಿ ಸಿಂಪಡಿಸಬೇಕು.',
  },
  {
    id: 'en_noise',
    lang: 'en-IN',
    langLabel: 'English ➔ Noise Pollution',
    dept: 'Noise & Environment (ENV)',
    icon: '🔊',
    title: 'Noise Violation (English)',
    text: 'Excessive loud commercial loudspeakers blasting throughout the night in Sector 7B violating municipal decibel limits.',
  },
]

type RecordingState = 'idle' | 'recording' | 'paused' | 'done'

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror:  ((event: SpeechRecognitionErrorEvent) => void) | null
  onend:    (() => void) | null
  start(): void
  stop():  void
  abort(): void
}
interface ISpeechRecognitionCtor { new(): ISpeechRecognition }

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function getSpeechRecognition(): ISpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?:       ISpeechRecognitionCtor
    webkitSpeechRecognition?: ISpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

// ─────────────────────────────────────────────
// AudioRecorder Component
// ─────────────────────────────────────────────

interface AudioRecorderProps {
  onTranscribed: (transcript: string, language: string) => void
  onAudioReady:  (blob: Blob) => void
  onClear:       () => void
  isProcessing:  boolean
}

function AudioRecorder({ onTranscribed, onAudioReady, onClear, isProcessing }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [elapsed, setElapsed]               = useState(0)
  const [audioUrl, setAudioUrl]             = useState<string | null>(null)
  const [isPlaying, setIsPlaying]           = useState(false)
  const [bars, setBars]                     = useState<number[]>(Array(36).fill(4))
  const [selectedLang, setSelectedLang]     = useState('ta-IN')
  const [liveText, setLiveText]             = useState('')
  const [finalText, setFinalText]           = useState('')
  const [apiSupported, setApiSupported]     = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef   = useRef<ISpeechRecognition | null>(null)
  const chunksRef        = useRef<BlobPart[]>([])
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef         = useRef<HTMLAudioElement | null>(null)
  const animFrameRef     = useRef<number | null>(null)
  const analyserRef      = useRef<AnalyserNode | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const finalTextRef     = useRef('')
  const audioCtxRef      = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!getSpeechRecognition()) setApiSupported(false)
  }, [])

  useEffect(() => {
    return () => { stopEverything() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopEverything = useCallback(() => {
    if (timerRef.current)       clearInterval(timerRef.current)
    if (animFrameRef.current)   cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current)      streamRef.current.getTracks().forEach(t => t.stop())
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {} }
    if (audioCtxRef.current)    { try { audioCtxRef.current.close() } catch {} }
  }, [])

  const drawBars = (analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const step = Math.floor(data.length / 36)
      setBars(Array.from({ length: 36 }, (_, i) => {
        const val = data[i * step] ?? 0
        return Math.max(4, Math.round((val / 255) * 56))
      }))
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }

  const startRecording = async () => {
    const SpeechRecognitionCtor = getSpeechRecognition()
    if (!SpeechRecognitionCtor) {
      toast.error('Your browser does not support Web Speech API. Use Chrome/Edge or click a test preset below.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      drawBars(analyser)

      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url  = URL.createObjectURL(blob)
        setAudioUrl(url)
        onAudioReady(blob)
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setBars(Array(36).fill(4))
      }
      mr.start()

      const recognition = new (SpeechRecognitionCtor as ISpeechRecognitionCtor)()
      recognitionRef.current = recognition
      recognition.lang = selectedLang
      recognition.continuous = true
      recognition.interimResults = true

      finalTextRef.current = ''
      setFinalText('')
      setLiveText('')

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        let finalChunk = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript
          if (event.results[i].isFinal) { finalChunk += t + ' ' }
          else                          { interim     += t        }
        }
        if (finalChunk) {
          finalTextRef.current += finalChunk
          setFinalText(finalTextRef.current)
        }
        setLiveText(interim)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return
        toast.error(`Speech recognition: ${event.error}`)
      }

      recognition.start()

      setRecordingState('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000)

    } catch {
      toast.error('Microphone permission required. Please allow microphone access and try again.')
    }
  }

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause()
    try { recognitionRef.current?.stop() } catch {}
    if (timerRef.current)     clearInterval(timerRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    setBars(Array(36).fill(4))
    setRecordingState('paused')
  }

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume()
    if (analyserRef.current) drawBars(analyserRef.current)

    const SpeechRecognitionCtor = getSpeechRecognition()
    if (SpeechRecognitionCtor) {
      const recognition = new (SpeechRecognitionCtor as ISpeechRecognitionCtor)()
      recognitionRef.current = recognition
      recognition.lang = selectedLang
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        let finalChunk = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript
          if (event.results[i].isFinal) { finalChunk += t + ' ' }
          else                          { interim     += t        }
        }
        if (finalChunk) {
          finalTextRef.current += finalChunk
          setFinalText(finalTextRef.current)
        }
        setLiveText(interim)
      }
      recognition.start()
    }

    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
    setRecordingState('recording')
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    try { recognitionRef.current?.stop() } catch {}
    if (timerRef.current)     clearInterval(timerRef.current)
    if (streamRef.current)    streamRef.current.getTracks().forEach(t => t.stop())
    setLiveText('')
    setRecordingState('done')

    // Automatically trigger translation, summarization and auto-filling
    const text = finalTextRef.current.trim()
    if (text) {
      onTranscribed(text, selectedLang)
    }
  }

  const clearRecording = () => {
    stopEverything()
    setRecordingState('idle')
    setAudioUrl(null)
    setElapsed(0)
    setIsPlaying(false)
    setLiveText('')
    setFinalText('')
    finalTextRef.current = ''
    chunksRef.current = []
    if (audioRef.current) audioRef.current.pause()
    onClear()
  }

  const togglePlayback = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
    else           { audioRef.current.play();  setIsPlaying(true)  }
  }

  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="text-xs font-semibold text-gray-700">Spoken Language:</span>
          <Select
            value={selectedLang}
            onValueChange={setSelectedLang}
            disabled={recordingState === 'recording' || recordingState === 'paused'}
          >
            <SelectTrigger className="h-8 text-xs w-48 border-purple-200 bg-white shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEECH_LANGUAGES.map(l => (
                <SelectItem key={l.code} value={l.code} className="text-xs">{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-100/70 px-2.5 py-1 rounded-full border border-purple-200">
          <Brain className="w-3.5 h-3.5 text-purple-600" />
          <span>Agent Auto-Fill &amp; Routing: Active</span>
        </div>
      </div>

      {/* Waveform & Listening Visualizer */}
      <div className="relative flex items-center justify-center h-28 bg-gradient-to-b from-gray-950 via-gray-900 to-black rounded-2xl border border-gray-800 overflow-hidden px-4 shadow-inner">
        {recordingState === 'idle' && (
          <div className="flex flex-col items-center gap-1.5 text-gray-400">
            <AudioLines className="w-7 h-7 text-purple-400 animate-pulse" />
            <span className="text-xs font-medium text-gray-300">
              Click <strong>"Start Speaking"</strong> and describe your problem naturally in your language
            </span>
          </div>
        )}

        {(recordingState === 'recording' || recordingState === 'paused') && (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-end gap-[3px] h-12">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className={`w-[3.5px] rounded-full transition-all duration-75 ${
                    recordingState === 'recording' ? 'bg-gradient-to-t from-red-500 via-pink-500 to-purple-400' : 'bg-gray-600'
                  }`}
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            {liveText ? (
              <p className="text-xs text-purple-200 italic truncate max-w-full px-3 bg-black/40 rounded-full py-0.5 border border-purple-500/20">
                "{liveText}"
              </p>
            ) : (
              <span className="text-[11px] text-gray-400 animate-pulse">Listening to civilian voice…</span>
            )}
          </div>
        )}

        {recordingState === 'done' && (
          <div className="flex flex-col items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">Voice Captured — Agent is Extracting &amp; Auto-Filling All Details…</span>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-xl font-bold tabular-nums ${
            recordingState === 'recording' ? 'text-red-600' : 'text-gray-700'
          }`}>
            {formatDuration(elapsed)}
          </span>
          {recordingState === 'recording' && (
            <span className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] text-red-600 font-bold">RECORDING</span>
            </span>
          )}
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 animate-pulse">
            <Spinner size="sm" />
            <span>Agent translating, summarizing keywords &amp; assigning department…</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
        {recordingState === 'idle' && (
          <Button
            type="button"
            onClick={startRecording}
            className="bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white gap-2.5 px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm font-bold"
          >
            <Mic className="w-5 h-5 animate-pulse" /> Speak My Complaint
          </Button>
        )}

        {recordingState === 'recording' && (
          <>
            <Button type="button" variant="outline" onClick={pauseRecording} className="gap-2 rounded-xl">
              <Pause className="w-4 h-4" /> Pause
            </Button>
            <Button
              type="button"
              onClick={stopRecording}
              className="bg-gray-900 hover:bg-black text-white gap-2 px-7 py-6 rounded-xl shadow-md font-bold"
            >
              <Square className="w-4 h-4 fill-white" /> Stop &amp; Auto-Fill Form
            </Button>
          </>
        )}

        {recordingState === 'paused' && (
          <>
            <Button type="button" variant="outline" onClick={resumeRecording} className="gap-2 rounded-xl">
              <Mic className="w-4 h-4" /> Resume
            </Button>
            <Button
              type="button"
              onClick={stopRecording}
              className="bg-gray-900 hover:bg-black text-white gap-2 px-7 py-6 rounded-xl shadow-md font-bold"
            >
              <Square className="w-4 h-4 fill-white" /> Stop &amp; Auto-Fill Form
            </Button>
          </>
        )}

        {recordingState === 'done' && (
          <>
            {audioUrl && (
              <>
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                <Button type="button" variant="outline" onClick={togglePlayback} className="gap-2 border-purple-200 rounded-xl">
                  {isPlaying ? <><Pause className="w-4 h-4" /> Pause Audio</> : <><Play className="w-4 h-4" /> Play Recording</>}
                </Button>
              </>
            )}
            <Button
              type="button"
              onClick={clearRecording}
              variant="outline"
              className="gap-2 text-gray-600 hover:text-red-600 rounded-xl"
            >
              <Trash2 className="w-4 h-4" /> Speak Again
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────

export default function NewComplaintPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [pipelineOutput, setPipelineOutput] = useState<VoicePipelineOutput | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  const [submitResult, setSubmitResult] = useState<{
    referenceNumber: string
    severity: number
    isEmergency: boolean
    department: string
    departmentCode?: string
    officer?: string
    priority: string
    slaHours?: number
    summary?: string
  } | null>(null)

  const voiceMetaRef = useRef<{ transcript: string; language: string } | null>(null)

  const {
    register, handleSubmit, setValue, watch, getValues,
  } = useForm<NewComplaintForm>({
    defaultValues: { category: 'water_supply', district: 'Central' },
  })

  // ─────────────────────────────────────────────
  // Core AI Agent Auto-Fill Pipeline
  // ─────────────────────────────────────────────
  const runVoiceIntelligence = async (transcript: string, languageHint = '', blob?: Blob) => {
    setIsAiProcessing(true)
    try {
      voiceMetaRef.current = { transcript, language: languageHint }
      const output = await aiApi.processVoicePipeline({
        text: transcript,
        audioBlob: blob ?? audioBlob ?? undefined,
        languageHint,
      })

      setPipelineOutput(output)

      // 100% Automatic Form Field Autofilling by AI Agent
      setValue('title', output.title, { shouldValidate: true })
      setValue('description', output.translated_text || output.summary, { shouldValidate: true })
      setValue('category', output.category)
      setValue('subCategory', output.sub_category || '')
      setValue('district', output.entities.district || 'Central')
      if (output.entities.ward) setValue('ward', output.entities.ward)
      if (output.entities.locations && output.entities.locations.length > 0) {
        setValue('address', output.entities.locations[0])
      } else {
        setValue('address', 'Main Road Area')
      }

      toast.success(
        `✨ Agent Auto-Filled Everything: ${output.language_name} ➔ ${output.recommended_department} (${output.department_code})`
      )
    } catch (err) {
      toast.error('AI agent encountered an issue processing the speech.')
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleAudioTranscribed = (transcript: string, language: string) => {
    runVoiceIntelligence(transcript, language)
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioBlob(file)
    toast.info(`Audio file "${file.name}" received. Agent is extracting & auto-filling…`)
    await runVoiceIntelligence(file.name.replace(/\.[^/.]+$/, ''), 'en-IN', file)
  }

  const handleSelectPreset = (preset: typeof DEMO_VOICE_PRESETS[0]) => {
    toast.info(`Running AI agent for "${preset.title}"…`)
    runVoiceIntelligence(preset.text, preset.lang)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? [])
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: NewComplaintForm) => {
    if (!data.description) {
      toast.error('Please speak your complaint first to let the AI agent auto-fill details.')
      return
    }
    setSubmitting(true)
    try {
      const rawUser = localStorage.getItem('govconnect_user')
      const user    = rawUser ? JSON.parse(rawUser) as { id: string; name: string; phone?: string } : null

      const result = await complaintsApi.create(
        { ...data, attachments: files },
        user?.id    ?? 'anonymous',
        user?.name  ?? 'Anonymous Citizen',
        {
          citizenPhone:       user?.phone,
          originalTranscript: voiceMetaRef.current?.transcript || pipelineOutput?.original_transcript,
          detectedLanguage:   pipelineOutput?.detected_language || voiceMetaRef.current?.language?.split('-')[0] || 'en',
        },
      )

      const c = result.data
      setSubmitResult({
        referenceNumber: c.referenceNumber,
        severity: pipelineOutput?.severity_score ?? (c.priority === 'critical' ? 5 : 3),
        isEmergency: c.priority === 'critical' || (pipelineOutput?.is_emergency ?? false),
        department: pipelineOutput?.recommended_department || c.department,
        departmentCode: pipelineOutput?.department_code || 'WSD',
        officer: c.assignedOfficerName || 'Assigned Department Field Desk',
        priority: c.priority,
        slaHours: pipelineOutput?.sla_hours || 48,
        summary: pipelineOutput?.summary || c.description,
      })
      toast.success(`Grievance filed! Reference: ${c.referenceNumber}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Submission failed: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success Screen ──────────────────────────────────────────
  if (submitResult) {
    const { referenceNumber, isEmergency, department, departmentCode, officer, priority, slaHours, summary } = submitResult
    const priorityColors: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high:     'bg-orange-100 text-orange-700 border-orange-200',
      medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
      low:      'bg-green-100 text-green-700 border-green-200',
    }

    return (
      <div className="max-w-xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            isEmergency ? 'bg-red-100 ring-8 ring-red-50' : 'bg-emerald-100 ring-8 ring-emerald-50'
          }`}>
            {isEmergency ? <AlertTriangle className="w-8 h-8 text-red-600" /> : <CheckCircle className="w-8 h-8 text-emerald-600" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Grievance Registered Successfully!</h2>
          <p className="text-sm text-gray-500">100% Spoken by Civilian ➔ Translated &amp; Auto-Assigned by AI Agent</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="text-xs text-gray-400 font-medium">Tracking Reference</span>
              <p className="text-lg font-mono font-bold text-gray-900">{referenceNumber}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${priorityColors[priority] ?? priorityColors.medium}`}>
              {priority} Priority
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
              <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Auto-Assigned Department
              </span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{department}</p>
              {departmentCode && <span className="text-[10px] text-purple-600 font-mono font-bold">{departmentCode}</span>}
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Resolution SLA
              </span>
              <p className="text-sm font-bold text-emerald-900 mt-0.5">{slaHours ?? 48} Hours</p>
              <span className="text-[10px] text-emerald-600">Standard Turnaround</span>
            </div>
          </div>

          {officer && (
            <div className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-lg">
              <span className="text-gray-500 font-medium">Assigned Officer / Desk:</span>
              <span className="font-semibold text-gray-900">{officer}</span>
            </div>
          )}

          {summary && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">AI Extracted Summary</span>
              <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
            </div>
          )}

          {isEmergency && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-800 text-xs font-semibold">
              <Zap className="w-4 h-4 text-red-600 shrink-0" />
              <span>🚨 Critical emergency flagged — dispatch unit alerted immediately.</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setSubmitResult(null); setPipelineOutput(null) }}>
            Speak Another Grievance
          </Button>
          <Button onClick={() => navigate('/citizen/history')} className="bg-purple-600 hover:bg-purple-700 text-white">
            View My Grievances
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/40 text-xs py-0.5">
              Zero Manual Typing
            </Badge>
            <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/40 text-xs py-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Dynamic Context Reasoning (Gemini 2.5 Flash)
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Speak Your Problem in Any Language.
          </h1>
          <p className="text-xs text-purple-200 max-w-2xl leading-relaxed">
            The AI agent immediately understands the context of your speech and <strong>dynamically determines the exact responsible department</strong> with zero static restrictions, autofilling the entire grievance record.
          </p>
        </div>
      </div>

      {/* ── DYNAMIC AI ENGINE STATUS BAR ── */}
      <div className="flex items-center justify-between bg-white border border-purple-200 rounded-xl px-4 py-2.5 shadow-sm text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 text-gray-700">
          <Brain className="w-4 h-4 text-purple-600 animate-pulse" />
          <span className="font-semibold text-gray-900">AI Routing Mode:</span>
          <span className="text-purple-700 font-medium">Dynamic Semantic Context Engine (No Static Mapping)</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="password"
            placeholder="Enter optional Gemini API Key..."
            defaultValue={localStorage.getItem('gemini_api_key') || ''}
            onChange={(e) => {
              if (e.target.value.trim()) {
                localStorage.setItem('gemini_api_key', e.target.value.trim())
                toast.success('Gemini API Key saved for live dynamic execution!')
              } else {
                localStorage.removeItem('gemini_api_key')
              }
            }}
            className="text-xs px-2.5 py-1 border border-purple-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-purple-50/40"
          />
          <Badge variant="outline" className="text-[10px] text-purple-700 border-purple-300">
            Auto-Detect
          </Badge>
        </div>
      </div>

      {/* ── 1-CLICK DEMO VOICE PRESETS ── */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-blue-50 border border-purple-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            1-Click Multilingual Voice Presets (Try Instant Auto-Fill)
          </span>
          <span className="text-[10px] text-purple-600 font-medium">Click any preset to simulate voice</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {DEMO_VOICE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="flex flex-col items-start text-left p-2.5 rounded-xl bg-white border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-sm">{preset.icon}</span>
                <span className="text-[11px] font-bold text-gray-800 group-hover:text-purple-700 truncate">
                  {preset.langLabel}
                </span>
              </div>
              <span className="text-[10px] text-purple-600 font-medium truncate mt-0.5">
                {preset.dept}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN VOICE RECORDING CARD ── */}
      <Card className="border-purple-200 bg-white shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            Civilian Voice Input
          </CardTitle>
          <p className="text-xs text-gray-500">
            Press record, speak naturally, and stop. The agent will translate, summarize, and auto-assign the grievance.
          </p>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <AudioRecorder
            onTranscribed={handleAudioTranscribed}
            onAudioReady={(blob) => setAudioBlob(blob)}
            onClear={() => {
              setAudioBlob(null)
              setPipelineOutput(null)
              setValue('description', '')
              setValue('title', '')
            }}
            isProcessing={isAiProcessing}
          />

          {/* Audio Upload Fallback */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1 text-gray-600">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" /> Or upload a voice audio recording:
            </span>
            <label htmlFor="audio-upload" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 cursor-pointer text-purple-700 font-semibold transition-all">
              <Upload className="w-3.5 h-3.5 text-purple-600" />
              <span>Upload Audio File (.mp3, .wav, .m4a)</span>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="sr-only"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ── AGENT 5-STAGE PIPELINE CARD ── */}
      {pipelineOutput && (
        <AIVoicePipelineCard
          pipeline={pipelineOutput}
          onDirectSubmit={handleSubmit(onSubmit)}
          isSubmitting={submitting}
        />
      )}

      {/* ── AUTO-FILLED GRIEVANCE CARD (1-Click Instant Filing) ── */}
      {pipelineOutput && (
        <Card className="border-emerald-300 bg-emerald-50/20 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-emerald-100 bg-emerald-50/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Grievance Details Auto-Filled by AI Agent
              </CardTitle>
              <Badge className="bg-emerald-600 text-white text-xs">
                Ready for Submission
              </Badge>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              Every field below was extracted, summarized, and routed directly from your spoken voice.
            </p>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                <span className="font-semibold text-gray-500 uppercase text-[10px]">Auto-Generated Title</span>
                <p className="font-bold text-gray-900 text-sm">{watch('title')}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                <span className="font-semibold text-gray-500 uppercase text-[10px]">Assigned Department</span>
                <p className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  {pipelineOutput.department_full_name} ({pipelineOutput.department_code})
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1 text-xs">
              <span className="font-semibold text-gray-500 uppercase text-[10px]">English Summary &amp; Description</span>
              <p className="text-gray-800 leading-relaxed">{watch('description')}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Category</span>
                <p className="font-bold text-gray-900 capitalize mt-0.5">{watch('category')?.replace('_', ' ')}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Location / Ward</span>
                <p className="font-bold text-gray-900 truncate mt-0.5">{watch('address') || 'Area'} · {watch('ward') || 'Ward 80'}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Turnaround SLA</span>
                <p className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {pipelineOutput.sla_hours} Hours
                </p>
              </div>
            </div>

            {/* Direct Instant Action Button */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowManualForm(v => !v)}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium"
              >
                {showManualForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showManualForm ? 'Hide advanced form fields' : 'Click to inspect/edit raw form fields'}
              </button>

              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={submitting}
                className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-bold px-7 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all gap-2"
              >
                {submitting ? (
                  <><Spinner size="sm" /> Registering Grievance…</>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Register Grievance Now
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── ADVANCED / OPTIONAL MANUAL FORM FIELDS ── */}
      {(showManualForm || !pipelineOutput) && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-900">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Grievance Details
                  {pipelineOutput && (
                    <span className="text-xs text-emerald-600 font-semibold ml-auto flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Auto-filled by Agent
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Complaint Title *
                  </label>
                  <Input
                    id="title"
                    placeholder="Brief title of your complaint"
                    {...register('title', { required: 'Title is required' })}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Description *
                  </label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Describe your issue or speak using the microphone above…"
                    {...register('description', { required: 'Description is required' })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Target Category *
                    </label>
                    <Select
                      value={watch('category')}
                      onValueChange={(v) => setValue('category', v as ComplaintCategory)}
                    >
                      <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="subCategory" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Sub-Category
                    </label>
                    <Input id="subCategory" placeholder="e.g. pipeline_leakage" {...register('subCategory')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-900">Location &amp; Ward Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Street Address / Landmark *
                  </label>
                  <Input id="address" placeholder="e.g. Main Market Junction, MG Road" {...register('address', { required: 'Address is required' })} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="ward" className="block text-xs font-bold uppercase tracking-wider text-gray-700">Ward</label>
                    <Input id="ward" placeholder="e.g. Ward 80" {...register('ward')} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="district" className="block text-xs font-bold uppercase tracking-wider text-gray-700">District *</label>
                    <Select onValueChange={(v) => setValue('district', v)} defaultValue="Central">
                      <SelectTrigger id="district"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="pincode" className="block text-xs font-bold uppercase tracking-wider text-gray-700">Pincode</label>
                    <Input id="pincode" placeholder="6 digits" {...register('pincode')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-900">Attachments (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {audioBlob && (
                  <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg mb-3 font-medium">
                    <Mic className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Voice recording attached ({(audioBlob.size / 1024).toFixed(1)} KB)</span>
                    <MicOff
                      className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 ml-auto cursor-pointer"
                      onClick={() => setAudioBlob(null)}
                      aria-label="Remove audio"
                    />
                  </div>
                )}

                <label htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-600 font-medium">Click to upload photos/documents</span>
                  <span className="text-[10px] text-gray-400">JPG, PNG, PDF up to 5MB</span>
                  <input id="file-upload" type="file" className="sr-only" multiple
                    accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                </label>

                {files.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {files.map((file, i) => (
                      <li key={i} className="flex items-center justify-between text-xs bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="truncate text-gray-700 font-medium">{file.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Manual Form Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => navigate('/citizen')}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 px-6 shadow-md"
              >
                {submitting ? (
                  <><Spinner size="sm" /> Filing Grievance…</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Submit Grievance</>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
