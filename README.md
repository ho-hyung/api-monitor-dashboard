# API Monitor Dashboard

A modern API monitoring dashboard with health checks, response time tracking, downtime alerts, and public status pages.

## Features

- **Health Check Monitoring**: Monitor API endpoints with configurable intervals (1min - 1hour)
- **Response Time Charts**: Visualize response times with interactive charts
- **Uptime Tracking**: 30-day uptime history with color-coded bars
- **Notifications**: Slack, Discord, and Email alerts for downtime
- **Public Status Page**: statuspage.io-style public status pages
- **Incident Management**: Track and communicate service incidents
- **Real-time Updates**: Supabase Realtime for live status updates

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Vercel Cron
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Charts**: Recharts
- **Notifications**: Slack/Discord Webhooks, Resend (Email)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/api-monitor-dashboard.git
cd api-monitor-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the schema from `supabase/schema.sql` in the SQL Editor
   - Enable Realtime for the `monitors` table

4. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-random-secret
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The cron job is configured in `vercel.json` to run every minute.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
├── components/           # React components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and services
└── types/                # TypeScript types
```

## API Reference

### Monitors

- `GET /api/monitors` - List all monitors
- `POST /api/monitors` - Create a monitor
- `GET /api/monitors/[id]` - Get monitor details
- `PATCH /api/monitors/[id]` - Update a monitor
- `DELETE /api/monitors/[id]` - Delete a monitor
- `GET /api/monitors/[id]/health-checks` - Get health check history

### Notifications

- `GET /api/notifications/channels` - List notification channels
- `POST /api/notifications/channels` - Create a channel
- `POST /api/notifications/channels/[id]/test` - Send test notification

### Incidents

- `GET /api/incidents` - List incidents
- `POST /api/incidents` - Create an incident
- `POST /api/incidents/[id]/updates` - Add incident update

### Public Status

- `GET /api/public/status/[slug]` - Get public status data

## License

MIT
