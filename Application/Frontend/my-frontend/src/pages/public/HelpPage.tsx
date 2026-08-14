import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Phone, Mail, MessageCircle, BookOpen } from 'lucide-react'

const FAQS = [
  {
    q: 'How do I file a new complaint?',
    a: 'Login with your citizen credentials, navigate to "New Complaint", fill in the details, and submit. You will receive a reference number via SMS and on screen.',
  },
  {
    q: 'How long does it take to resolve a complaint?',
    a: 'Timelines vary by category. Public safety issues are addressed within 12 hours. Water and electricity issues within 24–48 hours. Road and other issues within 72 hours. You can track real-time status using your reference number.',
  },
  {
    q: 'Can I file a complaint by phone?',
    a: 'Yes! Call our helpline 1800-GOV-HELP (free) 24×7. Our AI-powered call center will register your complaint and provide a reference number.',
  },
  {
    q: 'I forgot my reference number. What should I do?',
    a: 'Login to your account and visit "My Complaints" to view all complaints and their reference numbers. You can also check your registered SMS.',
  },
  {
    q: 'How do I escalate a complaint that is not resolved?',
    a: 'If the SLA deadline has passed, the complaint is automatically escalated. You can also request manual escalation by clicking "Escalate" in the complaint detail page.',
  },
  {
    q: 'What languages are supported?',
    a: 'The portal supports English, Hindi, Tamil, Telugu, Marathi, and Bengali. Our AI call center can process calls in all supported languages.',
  },
  {
    q: 'Is my personal data safe?',
    a: 'Yes. GovConnect uses government-grade encryption and complies with all applicable data protection regulations. Your data is never shared with third parties.',
  },
]

const CONTACTS = [
  { icon: Phone, label: 'Helpline', value: '1800-GOV-HELP', sub: 'Free · 24×7', color: 'bg-blue-50 text-blue-600' },
  { icon: Mail, label: 'Email Support', value: 'help@govconnect.gov.in', sub: 'Response within 24h', color: 'bg-green-50 text-green-600' },
  { icon: MessageCircle, label: 'Live Chat', value: 'Chat with us', sub: 'Mon–Fri 9am–6pm', color: 'bg-purple-50 text-purple-600' },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const id = q.replace(/\s+/g, '-').toLowerCase()

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={id}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div id={id} className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-gray-500">Find answers to common questions or contact our support team.</p>
        </div>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {CONTACTS.map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center gap-2">
              <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-blue-600 text-sm font-medium">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>

        {/* Escalation guide */}
        <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Still need help?</h3>
          <p className="text-sm text-blue-700 mb-4">
            If your issue is not resolved here, our support team is available via phone and email. For urgent civic emergencies, call the helpline directly.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Login &amp; File Complaint
            </a>
            <a
              href="/track-complaint"
              className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Track Existing Complaint
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
