-- API Monitor Dashboard Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Monitors table
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'HEAD')),
  interval_seconds INTEGER NOT NULL DEFAULT 300 CHECK (interval_seconds >= 60),
  current_status VARCHAR(10) NOT NULL DEFAULT 'unknown' CHECK (current_status IN ('up', 'down', 'unknown')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Health checks table
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('up', 'down', 'unknown')),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification channels table
CREATE TABLE notification_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('slack', 'discord', 'email')),
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert rules table
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
  trigger_after_failures INTEGER NOT NULL DEFAULT 1,
  notify_on_recovery BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert logs table
CREATE TABLE alert_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('sent', 'failed')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status page settings table
CREATE TABLE status_page_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  theme_color VARCHAR(7) NOT NULL DEFAULT '#000000',
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monitor_id UUID REFERENCES monitors(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  severity VARCHAR(10) NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incident updates table
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_monitors_user_id ON monitors(user_id);
CREATE INDEX idx_health_checks_monitor_id ON health_checks(monitor_id);
CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at DESC);
CREATE INDEX idx_notification_channels_user_id ON notification_channels(user_id);
CREATE INDEX idx_alert_rules_monitor_id ON alert_rules(monitor_id);
CREATE INDEX idx_alert_logs_monitor_id ON alert_logs(monitor_id);
CREATE INDEX idx_alert_logs_sent_at ON alert_logs(sent_at DESC);
CREATE INDEX idx_status_page_settings_slug ON status_page_settings(slug);
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_monitor_id ON incidents(monitor_id);
CREATE INDEX idx_incident_updates_incident_id ON incident_updates(incident_id);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;

-- Monitors policies
CREATE POLICY "Users can view their own monitors"
  ON monitors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monitors"
  ON monitors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitors"
  ON monitors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitors"
  ON monitors FOR DELETE
  USING (auth.uid() = user_id);

-- Public monitors policy for status page
CREATE POLICY "Anyone can view public monitors"
  ON monitors FOR SELECT
  USING (is_public = true);

-- Health checks policies
CREATE POLICY "Users can view health checks for their monitors"
  ON health_checks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM monitors WHERE monitors.id = health_checks.monitor_id AND monitors.user_id = auth.uid()
  ));

CREATE POLICY "Public health checks for public monitors"
  ON health_checks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM monitors WHERE monitors.id = health_checks.monitor_id AND monitors.is_public = true
  ));

-- Service role can insert health checks (for cron job)
CREATE POLICY "Service role can insert health checks"
  ON health_checks FOR INSERT
  WITH CHECK (true);

-- Notification channels policies
CREATE POLICY "Users can manage their own notification channels"
  ON notification_channels FOR ALL
  USING (auth.uid() = user_id);

-- Alert rules policies
CREATE POLICY "Users can manage alert rules for their monitors"
  ON alert_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM monitors WHERE monitors.id = alert_rules.monitor_id AND monitors.user_id = auth.uid()
  ));

-- Alert logs policies
CREATE POLICY "Users can view alert logs for their monitors"
  ON alert_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM monitors WHERE monitors.id = alert_logs.monitor_id AND monitors.user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert alert logs"
  ON alert_logs FOR INSERT
  WITH CHECK (true);

-- Status page settings policies
CREATE POLICY "Users can manage their own status page settings"
  ON status_page_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public status pages"
  ON status_page_settings FOR SELECT
  USING (is_public = true);

-- Incidents policies
CREATE POLICY "Users can manage their own incidents"
  ON incidents FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view incidents for public monitors"
  ON incidents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM monitors WHERE monitors.id = incidents.monitor_id AND monitors.is_public = true
  ) OR EXISTS (
    SELECT 1 FROM status_page_settings WHERE status_page_settings.user_id = incidents.user_id AND status_page_settings.is_public = true
  ));

-- Incident updates policies
CREATE POLICY "Users can manage updates for their incidents"
  ON incident_updates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM incidents WHERE incidents.id = incident_updates.incident_id AND incidents.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view updates for public incidents"
  ON incident_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM incidents
    JOIN monitors ON monitors.id = incidents.monitor_id
    WHERE incidents.id = incident_updates.incident_id AND monitors.is_public = true
  ));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_monitors_updated_at
  BEFORE UPDATE ON monitors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_channels_updated_at
  BEFORE UPDATE ON notification_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_page_settings_updated_at
  BEFORE UPDATE ON status_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for monitors table
ALTER PUBLICATION supabase_realtime ADD TABLE monitors;
