import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Brain, CheckCircle, ArrowRight, Users, FileText,
  Clock, AlertTriangle, Mic, Siren, Star, Phone, Zap,
  MapPin, BadgeCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ─── data ──────────────────────────────────────────────────────
const STATS = [
  { label: 'Complaints Resolved', value: '1,28,400+', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'Active Citizens',     value: '4.2 Lakh+', icon: Users,       color: 'text-sky-400',     bg: 'bg-sky-400/10'     },
  { label: 'Avg Resolution',      value: '38 hrs',    icon: Clock,       color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
  { label: 'Satisfaction',        value: '4.1 / 5',   icon: Star,        color: 'text-rose-400',    bg: 'bg-rose-400/10'    },
]

const SERVICES = [
  { icon: AlertTriangle, title: 'File a Complaint',   desc: 'Text or voice, any language',  color: 'bg-red-600',    to: '/login'           },
  { icon: FileText,      title: 'Track Complaint',    desc: 'Check real-time status',        color: 'bg-red-700',    to: '/track-complaint' },
  { icon: Mic,           title: 'Voice Recording',    desc: 'Speak — AI will transcribe',   color: 'bg-orange-600', to: '/login'           },
  { icon: Phone,         title: 'Helpline 24×7',      desc: '1800-XXX-XXXX · Free call',    color: 'bg-rose-800',   to: '/login'           },
  { icon: MapPin,        title: 'Nearest Office',     desc: 'Find your ward office',         color: 'bg-slate-700',  to: '/login'           },
  { icon: BadgeCheck,    title: 'Check Resolution',   desc: 'Rate & give feedback',          color: 'bg-slate-700',  to: '/login'           },
]

const STEPS = [
  { n: '01', icon: AlertTriangle, title: 'Submit',    desc: 'File by text, voice or phone in any language',         color: 'bg-red-600'     },
  { n: '02', icon: Brain,         title: 'AI Routes', desc: 'AI classifies and assigns to right department in seconds', color: 'bg-violet-600'  },
  { n: '03', icon: Zap,           title: 'Dispatch',  desc: 'Officer is notified with full context and location',   color: 'bg-orange-500'  },
  { n: '04', icon: CheckCircle,   title: 'Resolved',  desc: 'You get SMS + in-app notification with closure report',color: 'bg-emerald-600' },
]

const FEED = [
  { ref: 'GRV-2024-00124', dept: 'Water Supply', priority: 'Critical', badge: 'bg-red-500',    time: '2 min ago'  },
  { ref: 'GRV-2024-00123', dept: 'Public Works', priority: 'High',     badge: 'bg-orange-500', time: '5 min ago'  },
  { ref: 'GRV-2024-00130', dept: 'Sanitation',   priority: 'Medium',   badge: 'bg-amber-500',  time: '11 min ago' },
  { ref: 'GRV-2024-00119', dept: 'Electricity',  priority: 'Resolved', badge: 'bg-emerald-500',time: '18 min ago' },
]

// ─── component ─────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [activeFeed, setActiveFeed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveFeed(p => (p + 1) % FEED.length), 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white antialiased">

      {/* ── Alert ticker ─────────────────────────────────────── */}
      <div className="bg-red-600 py-1.5 flex items-center justify-center gap-6 text-[11px] font-bold tracking-widest uppercase overflow-hidden">
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          Live
        </span>
        <span className="hidden sm:block">
          Emergency civic response system active &nbsp;·&nbsp; AI online &nbsp;·&nbsp; 24 × 7 monitoring
        </span>
        <span className="sm:hidden">24 × 7 AI Monitoring Active</span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" style={{ animationDelay: '700ms' }} />
          AI Online
        </span>
      </div>

      {/* ── Navbar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-md border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-[15px] leading-none tracking-tight">
                Gov<span className="text-red-500">Connect</span>
              </p>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.15em] leading-none mt-0.5">
                Citizen Response Platform
              </p>
            </div>
          </div>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-slate-400">
            <button type="button" onClick={() => navigate('/track-complaint')}
              className="hover:text-white transition-colors">Track Complaint</button>
            <button type="button" onClick={() => navigate('/login')}
              className="hover:text-white transition-colors">Login</button>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm"
              className="text-slate-400 hover:text-white hover:bg-white/5 hidden sm:flex"
              onClick={() => navigate('/track-complaint')}>
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Track
            </Button>
            <Button size="sm"
              className="bg-red-600 hover:bg-red-500 text-white font-bold gap-1.5 px-4 shadow-md shadow-red-600/30 transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={() => navigate('/login')}>
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />
        {/* Glow */}
        <div className="absolute top-0 left-0 w-[700px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12 flex flex-col lg:flex-row items-center gap-12">

          {/* ── Left copy ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-red-400 uppercase tracking-[0.12em] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Official Government Grievance Portal
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black leading-[1.1] tracking-tight mb-5">
              Your Problem.<br />
              Our Priority.<br />
              <span className="text-red-500">Resolved Fast.</span>
            </h1>

            <p className="text-slate-400 text-[15px] sm:text-base leading-relaxed max-w-xl mb-8">
              GovConnect is the official AI-powered civic complaint platform. File an issue by voice
              or text in any language — AI routes it instantly to the right department, and
              you're notified every step until resolution.
            </p>

            {/* Primary buttons */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Button size="lg"
                className="bg-red-600 hover:bg-red-500 text-white font-bold gap-2 px-8 h-12 text-[15px] shadow-lg shadow-red-600/30 transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => navigate('/login')}>
                <AlertTriangle className="w-4 h-4" />
                File a Complaint
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline"
                className="border-red-600 bg-red-600 text-white hover:bg-red-500 hover:border-red-500 font-semibold gap-2 px-8 h-12 text-[15px] transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => navigate('/track-complaint')}>
                <FileText className="w-4 h-4" />
                Track My Complaint
              </Button>
            </div>

            {/* Trust chips */}
            <div className="flex flex-wrap gap-2.5">
              {[
                { icon: Shield,    text: 'Govt-grade secure',        color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'  },
                { icon: Clock,     text: '24 × 7 response',          color: 'text-amber-400 border-amber-400/20 bg-amber-400/5'        },
                { icon: Mic,       text: '12 languages',             color: 'text-sky-400 border-sky-400/20 bg-sky-400/5'              },
                { icon: Brain,     text: 'AI-powered routing',       color: 'text-violet-400 border-violet-400/20 bg-violet-400/5'     },
              ].map(({ icon: Icon, text, color }) => (
                <span key={text} className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-[11px] font-medium ${color}`}>
                  <Icon className="w-3 h-3" />{text}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: live dashboard card ───────────────────── */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">

              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-white/[0.03]">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-[12px] font-bold text-slate-200 uppercase tracking-wider">Live Grievance Feed</span>
                </div>
                <span className="text-[10px] text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                  {FEED.length} active
                </span>
              </div>

              {/* Feed rows */}
              <div className="divide-y divide-white/[0.05]">
                {FEED.map((item, i) => (
                  <div key={item.ref}
                    className={`flex items-center gap-3 px-5 py-3 transition-all duration-700 ${i === activeFeed ? 'bg-white/[0.05]' : ''}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.badge}`} />
                    <span className="text-[11px] font-mono text-slate-500 shrink-0 w-28">{item.ref}</span>
                    <span className="text-[12px] text-slate-300 flex-1 truncate font-medium">{item.dept}</span>
                    <span className="text-[10px] text-slate-600 shrink-0">{item.time}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white shrink-0 ${item.badge}`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI footer */}
              <div className="flex items-center gap-2.5 px-5 py-3 border-t border-white/[0.07] bg-white/[0.02]">
                <Brain className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="text-[11px] text-slate-500 flex-1">AI classifying & routing in real-time</span>
                <div className="flex gap-[3px]">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════ */}
      <section className="border-y border-white/[0.07] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-none">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SERVICE TILES
      ══════════════════════════════════════════════════════ */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-red-500 mb-2">Quick Access</p>
            <h2 className="text-2xl font-black text-white">What do you need right now?</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SERVICES.map(({ icon: Icon, title, desc, color, to }) => (
              <button key={title} type="button" onClick={() => navigate(to)}
                className={`group ${color} rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 active:scale-95`}
              >
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3 group-hover:bg-white/25 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                </div>
                <p className="text-white font-bold text-[13px] leading-snug">{title}</p>
                <p className="text-white/55 text-[11px] mt-0.5 leading-snug">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="py-14 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-red-500 mb-2">Process</p>
              <h2 className="text-2xl font-black text-white">From complaint to resolution</h2>
            </div>
            <p className="text-slate-500 text-sm max-w-xs">Average resolution time: <span className="text-amber-400 font-bold">38 hours</span></p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map(({ n, icon: Icon, title, desc, color }) => (
              <div key={n} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-600">{n}</span>
                </div>
                <h3 className="text-[15px] font-bold text-white mb-1.5">{title}</h3>
                <p className="text-slate-500 text-[12px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="py-14 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-red-700 via-red-600 to-rose-700 overflow-hidden p-10 sm:p-14 text-center shadow-2xl shadow-red-900/40">
            {/* Decorative pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 24px,rgba(0,0,0,.4) 24px,rgba(0,0,0,.4) 48px)',
              }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Need immediate help?
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
                Don't wait. File now.
              </h2>
              <p className="text-red-100 text-[15px] max-w-xl mx-auto mb-8 leading-relaxed">
                Our AI prioritises urgent complaints and alerts the nearest available officer
                within minutes. Your issue matters — we act on it fast.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg"
                  className="bg-white text-red-700 hover:bg-red-50 font-black gap-2 px-8 h-12 text-[15px] shadow-lg transition-all hover:scale-105 active:scale-95"
                  onClick={() => navigate('/login')}>
                  <AlertTriangle className="w-4 h-4" />
                  File Emergency Complaint
                </Button>
                <Button size="lg"
                  className="bg-red-800/60 hover:bg-red-800 border border-white/20 text-white font-semibold gap-2 px-8 h-12 text-[15px] transition-all hover:scale-105 active:scale-95"
                  onClick={() => navigate('/track-complaint')}>
                  <FileText className="w-4 h-4" />
                  Track Existing Complaint
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.07] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
              <Siren className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-black">Gov<span className="text-red-500">Connect</span></span>
            <span className="text-[11px] text-slate-600">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-500" /> Encrypted</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> 24 × 7</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-sky-500" /> WCAG 2.1 AA</span>
            <span className="flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-violet-500" /> Official</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
