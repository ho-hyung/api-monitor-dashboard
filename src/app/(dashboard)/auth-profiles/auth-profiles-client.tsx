'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AuthProfileForm } from '@/components/auth-profiles/auth-profile-form'
import { toast } from 'sonner'
import { Plus, Key, Trash2, Pencil, TestTube } from 'lucide-react'
import type { AuthProfile } from '@/types/database'

interface AuthProfilesClientProps {
  initialProfiles: AuthProfile[]
}

export function AuthProfilesClient({ initialProfiles }: AuthProfilesClientProps) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<AuthProfile | null>(null)
  const [deletingProfile, setDeletingProfile] = useState<AuthProfile | null>(null)
  const [testingProfile, setTestingProfile] = useState<string | null>(null)
  const router = useRouter()

  const handleCreate = async (data: Partial<AuthProfile>) => {
    try {
      const response = await fetch('/api/auth-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create profile')
      }

      const newProfile = await response.json()
      setProfiles([newProfile, ...profiles])
      setIsCreateOpen(false)
      toast.success('Auth profile created')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create profile')
    }
  }

  const handleUpdate = async (data: Partial<AuthProfile>) => {
    if (!editingProfile) return

    try {
      const response = await fetch(`/api/auth-profiles/${editingProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      setProfiles(profiles.map(p => p.id === editingProfile.id ? updatedProfile : p))
      setEditingProfile(null)
      toast.success('Auth profile updated')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    }
  }

  const handleDelete = async () => {
    if (!deletingProfile) return

    try {
      const response = await fetch(`/api/auth-profiles/${deletingProfile.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete profile')
      }

      setProfiles(profiles.filter(p => p.id !== deletingProfile.id))
      setDeletingProfile(null)
      toast.success('Auth profile deleted')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete profile')
    }
  }

  const handleTest = async (profileId: string) => {
    setTestingProfile(profileId)

    try {
      const response = await fetch(`/api/auth-profiles/${profileId}/test`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Token fetched successfully: ${result.token_preview}`)
      } else {
        toast.error(`Token fetch failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Test failed')
    } finally {
      setTestingProfile(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auth Profiles</h1>
          <p className="text-muted-foreground">
            Manage authentication profiles for API monitoring
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Auth Profile</DialogTitle>
              <DialogDescription>
                Configure authentication for APIs that require login
              </DialogDescription>
            </DialogHeader>
            <AuthProfileForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No auth profiles</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create an auth profile to monitor APIs that require authentication
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map(profile => (
            <Card key={profile.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <CardDescription className="mt-1 truncate max-w-[300px]">
                      {profile.login_url}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{profile.token_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <span>{profile.login_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token Path:</span>
                    <span className="font-mono text-xs">{profile.token_path}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Header:</span>
                    <span className="font-mono text-xs">{profile.header_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{profile.expires_in_seconds ? `${profile.expires_in_seconds}s` : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(profile.id)}
                    disabled={testingProfile === profile.id}
                  >
                    <TestTube className="mr-1 h-4 w-4" />
                    {testingProfile === profile.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProfile(profile)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingProfile(profile)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Auth Profile</DialogTitle>
            <DialogDescription>
              Update authentication configuration
            </DialogDescription>
          </DialogHeader>
          {editingProfile && (
            <AuthProfileForm
              profile={editingProfile}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProfile(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProfile} onOpenChange={(open) => !open && setDeletingProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Auth Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingProfile?.name}&quot;?
              Monitors using this profile will no longer have authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
