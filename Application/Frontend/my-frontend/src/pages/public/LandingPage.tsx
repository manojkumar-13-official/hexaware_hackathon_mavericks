import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone, Shield, BarChart3, Brain, CheckCircle, ArrowRight,
  Star, Users, FileText, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const STATS = [
  { label: 'Complaints Resolved', value: '1,28,400+', icon: CheckCircle, color: 'text-green-600' },
  { label: 'Active Citizens', value: '4.2L+', icon: Users, color: 'text-blue-600' },
  { label: 'Avg Resolution', value: '38 hrs', icon: Clock, color: 'text-orange-600' },
  { label: 'Satisfaction Rate', value: '4.1/5', icon: Star, color: 'text-yellow-500' },
]

const FEATURES = [
  {
    icon: Phone,
    title: 'AI-Powered Call Center',
    description: 'Every citizen call is transcribed, analysed, and routed automatically with real-time AI assistance.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Brain,
    title: 'Smart Complaint Processing',
    description: 'Natural language understanding auto-classifies, prioritises, and assigns grievances to the right department.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics Dashboard',
    description: 'Real-time KPIs, resolution trends, and sentiment analysis give administrators full situational awareness.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Shield,
    title: 'Secure & Accessible',
    description: 'Government-grade security, WCAG 2.1 AA compliance, and multi-language support for every citizen.',
    color: 'bg-red-50 text-red-600',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Submit Complaint', description: 'Citizen submits via web portal or phone call in any language.' },
  { step: '02', title: 'AI Analysis', description: 'AI classifies, summarises, and routes to the correct department instantly.' },
  { step: '03', title: 'Officer Action', description: 'Assigned officer reviews AI insights and resolves the complaint.' },
  { step: '04', title: 'Citizen Notified', description: 'SMS and in-app updates keep the citizen informed at every step.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 text-white overflow-hidden">
        {/* decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 -left-16 w-64 h-64 bg-white/5 rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="inline-block bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-wide">
              Government Digital Services
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
              AI-Powered Citizen<br />
              <span className="text-yellow-300">Call Intelligence</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8 max-w-xl">
              GovConnect transforms every citizen interaction — phone calls, complaints, and grievances — into actionable intelligence using state-of-the-art AI.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold"
                onClick={() => navigate('/login')}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-700 hover:text-white font-semibold cursor-pointer"
                onClick={() => navigate('/track-complaint')}
              >
                Track My Complaint
              </Button>
            </div>
          </div>

          {/* Hero illustration card */}
          <div className="flex-1 w-full max-w-sm lg:max-w-md">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/20">
                <span className="w-3 h-3 bg-red-400 rounded-full" />
                <span className="w-3 h-3 bg-yellow-400 rounded-full" />
                <span className="w-3 h-3 bg-green-400 rounded-full" />
                <span className="ml-2 text-xs text-white/60 font-mono">Live Call Dashboard</span>
              </div>
              {[
                { ref: 'GRV-2024-00124', sentiment: '🚨 Urgent', dept: 'Water Supply', priority: 'Critical' },
                { ref: 'GRV-2024-00123', sentiment: '😤 Frustrated', dept: 'Public Works', priority: 'High' },
                { ref: 'GRV-2024-00130', sentiment: '😐 Neutral', dept: 'Sanitation', priority: 'Medium' },
              ].map((item) => (
                <div key={item.ref} className="bg-white/10 rounded-lg p-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-blue-200">{item.ref}</span>
                  <span className="text-xs text-white">{item.sentiment}</span>
                  <span className="text-xs text-blue-200">{item.dept}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.priority === 'Critical' ? 'bg-red-500/80' : item.priority === 'High' ? 'bg-orange-500/80' : 'bg-yellow-500/80'}`}>
                    {item.priority}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <span className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
                <span className="text-xs text-white/60">AI processing 3 active calls…</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className={`w-8 h-8 shrink-0 ${color}`} aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Intelligent Government Services</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              A unified platform connecting citizens, call center agents, officers, and administrators with AI at the core.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-lg ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <span className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                  {step}
                </span>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="bg-blue-600 py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-blue-100 mb-8">
            Login with your government credentials or track an existing complaint.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
              onClick={() => navigate('/login')}
            >
              <Shield className="w-4 h-4" /> Citizen Login
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => navigate('/track-complaint')}
            >
              <FileText className="w-4 h-4" /> Track Complaint
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-xs">
        © {new Date().getFullYear()} GovConnect — AI-Powered Citizen Call Intelligence. All rights reserved.
      </footer>
    </div>
  )
}
