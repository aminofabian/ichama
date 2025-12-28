# Cron Job Setup for Contribution Reminders

This document explains how to set up the cron job for sending WhatsApp contribution reminders.

## Overview

The system sends WhatsApp reminders to users at the following intervals:
- **7 days before due date**: When a new period starts (also sent immediately when period begins)
- **3 days before due date**: Reminder that contribution is due soon
- **1 day before due date**: Final reminder before deadline
- **On due date**: Reminder that contribution is due today

## API Endpoint

The cron job endpoint is available at:
```
GET/POST /api/cron/send-reminders
```

## Security

The endpoint is protected by a secret token. Set the following environment variable:

```bash
CRON_SECRET=your-secret-token-here
```

The cron service should include this secret in the request:
- As a query parameter: `?secret=your-secret-token-here`
- Or as an Authorization header: `Authorization: Bearer your-secret-token-here`

## Setting Up Cron Jobs

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Add a `vercel.json` file in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders?secret=your-secret-token-here",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9 AM UTC. Adjust the schedule as needed using cron syntax.

### Option 2: External Cron Service

Use a service like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

Configure it to call:
```
https://your-domain.com/api/cron/send-reminders?secret=your-secret-token-here
```

Recommended schedule: **Once daily** (e.g., 9:00 AM UTC)

### Option 3: Server Cron (For self-hosted)

Add to your server's crontab:

```bash
0 9 * * * curl -X GET "https://your-domain.com/api/cron/send-reminders?secret=your-secret-token-here"
```

## How It Works

1. The cron job queries the database for contributions that:
   - Are pending or partially paid
   - Have a due date within the next 7 days
   - Belong to active cycles

2. For each contribution, it checks:
   - How many days until the due date (0, 1, 3, or 7)
   - Whether a reminder for that day has already been sent

3. If a reminder is needed and hasn't been sent:
   - Sends a WhatsApp message to the user
   - Records the reminder in the database to prevent duplicates

## Testing

You can manually trigger the cron job by calling the endpoint:

```bash
curl -X GET "http://localhost:3000/api/cron/send-reminders?secret=your-secret-token-here"
```

Or in production:

```bash
curl -X GET "https://your-domain.com/api/cron/send-reminders?secret=your-secret-token-here"
```

## Response Format

The endpoint returns a JSON response with details about processed reminders:

```json
{
  "success": true,
  "message": "Processed 10 contributions. Sent 8, skipped 2, errors 0",
  "data": {
    "processed": 10,
    "sent": 8,
    "skipped": 2,
    "errors": 0,
    "details": [
      {
        "contribution_id": "...",
        "reminder_type": "three_days_before",
        "status": "sent"
      }
    ]
  }
}
```

## Notes

- Reminders are only sent once per type per contribution
- The system automatically tracks which reminders have been sent
- Failed sends are logged but don't prevent other reminders from being sent
- In development mode, reminders are logged to console instead of being sent

