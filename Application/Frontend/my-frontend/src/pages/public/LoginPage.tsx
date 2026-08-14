import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LoginCredentials } from '@/types'

// Demo credentials shown below the form for hackathon convenience
const DEMO_ACCOUNTS = [
  { role: 'Citizen',      email: 'citizen@demo.gov.in',   label: 'bg-blue-100 text-blue-700' },
  { role: 'Call Center',  email: 'agent@demo.gov.in',     label: 'bg-purple-100 text-purple-700' },
  { role: 'Officer',      email: 'officer@demo.gov.in',   label: 'bg-green-100 text-green-700' },
  { role: 'Admin',        email: 'admin@demo.gov.in',     label: 'bg-red-100 text-red-700' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({ defaultValues: { email: '', password: '' } })

  const onSubmit = async (data: LoginCredentials) => {
    setError(null)
    try {
      await login(data)
      toast.success('Welcome back!')
      // Redirect handled by GuestGuard reading auth state
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(msg)
    }
  }

  const fillDemo = (email: string) => {
    setValue('email', email)
    setValue('password', 'demo123')
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to GovConnect</h1>
          <p className="text-sm text-gray-500 mt-1">Use your government-issued credentials</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-5"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@domain.gov.in"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password', { required: 'Password is required', minLength: { value: 4, message: 'Min 4 characters' } })}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <button type="button" className="text-blue-600 hover:underline focus:outline-none">
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        {/* Demo accounts */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Demo Accounts (password: demo123)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map(({ role, email, label }) => (
              <button
                key={email}
                type="button"
                onClick={() => fillDemo(email)}
                className="flex flex-col items-start p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded mb-1 ${label}`}>{role}</span>
                <span className="text-xs text-gray-500 truncate w-full">{email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Need help?{' '}
          <a href="/help" className="text-blue-600 hover:underline">Visit Help Center</a>
        </p>
      </div>
    </div>
  )
}
