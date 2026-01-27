'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, MessageSquare, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Monitor {
  id: string
  name: string
}

interface IncidentUpdate {
  id: string
  status: string
  message: string
  created_at: string
}

interface Incident {
  id: string
  title: string
  status: string
  severity: string
  monitor_id: string | null
  started_at: string
  resolved_at: string | null
  monitors: { name: string } | null
  incident_updates: IncidentUpdate[]
}

interface IncidentsClientProps {
  initialIncidents: Incident[]
  monitors: Monitor[]
}

export function IncidentsClient({ initialIncidents, monitors }: IncidentsClientProps) {
  const router = useRouter()
  const [incidents] = useState(initialIncidents)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Create form state
  const [title, setTitle] = useState('')
  const [monitorId, setMonitorId] = useState<string>('')
  const [severity, setSeverity] = useState<string>('minor')

  // Update form state
  const [updateStatus, setUpdateStatus] = useState<string>('investigating')
  const [updateMessage, setUpdateMessage] = useState('')

  const severityColors: Record<string, string> = {
    minor: 'bg-yellow-100 text-yellow-700',
    major: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }

  const statusColors: Record<string, string> = {
    investigating: 'bg-blue-100 text-blue-700',
    identified: 'bg-yellow-100 text-yellow-700',
    monitoring: 'bg-purple-100 text-purple-700',
    resolved: 'bg-green-100 text-green-700',
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          monitor_id: monitorId || null,
          severity,
          status: 'investigating',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? 'Failed to create incident')
        return
      }

      toast.success('Incident created')
      setShowCreateDialog(false)
      setTitle('')
      setMonitorId('')
      setSeverity('minor')
      router.refresh()
    } catch {
      toast.error('Failed to create incident')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIncident) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/incidents/${selectedIncident.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatus,
          message: updateMessage,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? 'Failed to add update')
        return
      }

      toast.success('Update added')
      setShowUpdateDialog(false)
      setUpdateStatus('investigating')
      setUpdateMessage('')
      setSelectedIncident(null)
      router.refresh()
    } catch {
      toast.error('Failed to add update')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (incident: Incident) => {
    if (!confirm(`Delete incident "${incident.title}"?`)) return

    try {
      const response = await fetch(`/api/incidents?id=${incident.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error ?? 'Failed to delete incident')
        return
      }

      toast.success('Incident deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete incident')
    }
  }

  const openUpdateDialog = (incident: Incident) => {
    setSelectedIncident(incident)
    setUpdateStatus(incident.status)
    setShowUpdateDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Incidents</h2>
          <p className="text-muted-foreground">
            Manage and track service incidents
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Incident
        </Button>
      </div>

      {incidents.length > 0 ? (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{incident.title}</CardTitle>
                    <CardDescription>
                      Started {new Date(incident.started_at).toLocaleString()}
                      {incident.resolved_at && (
                        <> • Resolved {new Date(incident.resolved_at).toLocaleString()}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={severityColors[incident.severity]}>
                      {incident.severity}
                    </Badge>
                    <Badge className={statusColors[incident.status]}>
                      {incident.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openUpdateDialog(incident)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Add Update
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(incident)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {incident.monitors && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Affected service: {incident.monitors.name}
                  </p>
                )}
                {incident.incident_updates?.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-sm font-medium">Recent updates:</p>
                    {incident.incident_updates
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 3)
                      .map(update => (
                        <div key={update.id} className="text-sm pl-3 border-l-2 border-muted">
                          <span className="text-muted-foreground">
                            {new Date(update.created_at).toLocaleString()} - {update.status}
                          </span>
                          <p>{update.message}</p>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              No incidents recorded yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Incident Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Incident</DialogTitle>
            <DialogDescription>
              Report a new service incident
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Service degradation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monitor">Affected Service (optional)</Label>
                <Select value={monitorId} onValueChange={setMonitorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {monitors.map(monitor => (
                      <SelectItem key={monitor.id} value={monitor.id}>
                        {monitor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Incident'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Incident Update</DialogTitle>
            <DialogDescription>
              Post an update to &quot;{selectedIncident?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="We are currently investigating the issue..."
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Posting...' : 'Post Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
