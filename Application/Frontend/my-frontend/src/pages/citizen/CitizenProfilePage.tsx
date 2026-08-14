import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { User, Mail, Phone, Shield, Camera } from 'lucide-react'
import { useAuth } from '@/contexts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import type { ProfileUpdateForm } from '@/types'

export default function CitizenProfilePage() {
  const { user, updateUser } = useAuth()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileUpdateForm>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  })

  const onSubmit = async (data: ProfileUpdateForm) => {
    setSaving(true)
    // BACKEND_HOOK: Replace with usersApi.updateMyProfile(data)
    await new Promise(r => setTimeout(r, 700))
    updateUser(data)
    toast.success('Profile updated successfully')
    setSaving(false)
  }

  if (!user) return null

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Avatar */}
      <Card>
        <CardContent className="pt-5 flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <button
              className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Change profile picture"
              // BACKEND_HOOK: usersApi.uploadAvatar(file)
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <Input
                id="name"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <Input
                id="email"
                type="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <Input
                id="phone"
                type="tel"
                leftIcon={<Phone className="w-4 h-4" />}
                placeholder="+91-XXXXXXXXXX"
                {...register('phone')}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Security section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Password</p>
              <p className="text-xs text-gray-400">Last changed: Never</p>
            </div>
            {/* BACKEND_HOOK: authApi.forgotPassword(user.email) flow */}
            <Button variant="outline" size="sm">Change Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
