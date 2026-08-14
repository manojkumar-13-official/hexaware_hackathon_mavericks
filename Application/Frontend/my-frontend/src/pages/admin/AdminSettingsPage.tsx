import React, { useState } from 'react'
import { toast } from 'sonner'
import { Settings, Bell, Globe, Palette, Save } from 'lucide-react'
import { useAppSettings } from '@/contexts'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useAppSettings()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // BACKEND_HOOK: POST /api/admin/settings with system-wide config
    await new Promise(r => setTimeout(r, 600))
    toast.success('Settings saved')
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500">Configure system-wide preferences</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Theme</p>
              <p className="text-xs text-gray-400">Choose light, dark, or system preference</p>
            </div>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    settings.theme === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">High Contrast</p>
              <p className="text-xs text-gray-400">Improve readability for accessibility</p>
            </div>
            <button
              onClick={() => updateSettings({ highContrast: !settings.highContrast })}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={settings.highContrast}
              aria-label="High contrast mode"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.highContrast ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Interface Density</p>
              <p className="text-xs text-gray-400">Controls padding and spacing</p>
            </div>
            <div className="flex gap-2">
              {(['compact', 'default', 'comfortable'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => updateSettings({ density: d })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    settings.density === d
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4" /> Language & Localization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Interface Language</p>
              <p className="text-xs text-gray-400">Select the default language for all users</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['en', 'hi', 'ta', 'te', 'mr', 'bn'] as const).map(lang => {
                const names: Record<string, string> = { en: 'EN', hi: 'हि', ta: 'த', te: 'తె', mr: 'म', bn: 'বা' }
                return (
                  <button
                    key={lang}
                    onClick={() => updateSettings({ language: lang })}
                    className={`w-10 h-8 rounded border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      settings.language === lang
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-pressed={settings.language === lang}
                    aria-label={lang}
                  >
                    {names[lang]}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'sound', label: 'Sound alerts', description: 'Play sound for new calls and escalations' },
            { key: 'desktop', label: 'Desktop notifications', description: 'Show browser push notifications' },
            { key: 'email', label: 'Email notifications', description: 'Send email for SLA breaches' },
          ].map(({ key, label, description }) => {
            const checked = settings.notifications[key as keyof typeof settings.notifications]
            return (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{description}</p>
                </div>
                <button
                  onClick={() => updateSettings({
                    notifications: { ...settings.notifications, [key]: !checked }
                  })}
                  className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    checked ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={checked}
                  aria-label={label}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* System info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4" /> System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            { label: 'Frontend Version', value: '1.0.0' },
            // BACKEND_HOOK: Fetch backend version from /api/health
            { label: 'Backend Version', value: 'Spring Boot 3.x (connect BACKEND_HOOK)' },
            { label: 'AI Model', value: 'govai-v1.2 (connect AI_HOOK)' },
            { label: 'Environment', value: import.meta.env.MODE },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-700 font-mono text-xs">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </div>
    </div>
  )
}
