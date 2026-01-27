export type MonitorStatus = 'up' | 'down' | 'unknown'
export type MonitorMethod = 'GET' | 'POST' | 'HEAD'
export type NotificationChannelType = 'slack' | 'discord' | 'email'
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'
export type IncidentSeverity = 'minor' | 'major' | 'critical'

export interface Monitor {
  id: string
  user_id: string
  name: string
  url: string
  method: MonitorMethod
  interval_seconds: number
  current_status: MonitorStatus
  is_public: boolean
  last_checked_at: string | null
  created_at: string
  updated_at: string
}

export interface HealthCheck {
  id: string
  monitor_id: string
  status: MonitorStatus
  response_time_ms: number | null
  status_code: number | null
  error_message: string | null
  checked_at: string
}

export interface NotificationChannel {
  id: string
  user_id: string
  name: string
  type: NotificationChannelType
  config: Record<string, string>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AlertRule {
  id: string
  monitor_id: string
  channel_id: string
  trigger_after_failures: number
  notify_on_recovery: boolean
  created_at: string
}

export interface AlertLog {
  id: string
  monitor_id: string
  channel_id: string
  status: 'sent' | 'failed'
  message: string
  sent_at: string
}

export interface StatusPageSettings {
  id: string
  user_id: string
  slug: string
  title: string
  description: string | null
  theme_color: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Incident {
  id: string
  user_id: string
  monitor_id: string | null
  title: string
  status: IncidentStatus
  severity: IncidentSeverity
  started_at: string
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface IncidentUpdate {
  id: string
  incident_id: string
  status: IncidentStatus
  message: string
  created_at: string
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      monitors: {
        Row: Monitor
        Insert: Omit<Monitor, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Monitor, 'id' | 'created_at' | 'updated_at'>>
      }
      health_checks: {
        Row: HealthCheck
        Insert: Omit<HealthCheck, 'id'>
        Update: Partial<Omit<HealthCheck, 'id'>>
      }
      notification_channels: {
        Row: NotificationChannel
        Insert: Omit<NotificationChannel, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<NotificationChannel, 'id' | 'created_at' | 'updated_at'>>
      }
      alert_rules: {
        Row: AlertRule
        Insert: Omit<AlertRule, 'id' | 'created_at'>
        Update: Partial<Omit<AlertRule, 'id' | 'created_at'>>
      }
      alert_logs: {
        Row: AlertLog
        Insert: Omit<AlertLog, 'id'>
        Update: Partial<Omit<AlertLog, 'id'>>
      }
      status_page_settings: {
        Row: StatusPageSettings
        Insert: Omit<StatusPageSettings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StatusPageSettings, 'id' | 'created_at' | 'updated_at'>>
      }
      incidents: {
        Row: Incident
        Insert: Omit<Incident, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Incident, 'id' | 'created_at' | 'updated_at'>>
      }
      incident_updates: {
        Row: IncidentUpdate
        Insert: Omit<IncidentUpdate, 'id' | 'created_at'>
        Update: Partial<Omit<IncidentUpdate, 'id' | 'created_at'>>
      }
    }
  }
}
