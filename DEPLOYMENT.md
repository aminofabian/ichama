# Deployment Guide

This guide walks you through deploying the Merry Chama platform to production.

## Prerequisites

- A Vercel account (or your preferred hosting platform)
- A Turso database instance
- SMS API credentials (for OTP)
- Environment variables configured

## Step 1: Set Up Turso Database

1. Create a Turso account at [turso.tech](https://turso.tech)
2. Create a new database
3. Note your database URL and auth token

## Step 2: Configure Environment Variables

Set the following environment variables in your hosting platform:

### Required Variables

```bash
# Database
TURSO_DATABASE_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your-auth-token

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Admin Access (comma-separated)
ADMIN_EMAILS=admin@example.com
# OR
ADMIN_PHONES=+254712345678

# SMS Service (for OTP)
SMS_API_URL=https://your-sms-api-url
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=MERRY
SMS_PARTNER_ID=your-partner-id

# WhatsApp Service (for OTP - optional)
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_TEMPLATE_NAME=authentication_code
WHATSAPP_API_VERSION=v21.0
```

### Optional Variables

```bash
# OTP Configuration
OTP_EXPIRY_MINUTES=10

# Session Configuration
SESSION_SECRET=your-random-secret-key
```

## Step 3: Deploy to Vercel

### Option A: Deploy via GitHub

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Step 4: Run Database Migrations

After deployment, run migrations on your production database:

```bash
# Set production environment variables
export TURSO_DATABASE_URL="your-production-url"
export TURSO_AUTH_TOKEN="your-production-token"

# Run migrations
bun run db:migrate
```

Alternatively, you can run migrations from your local machine pointing to production, or use a Vercel build script.

## Step 5: Seed Demo Data (Optional)

To populate with demo data:

```bash
bun run db:seed
```

**Note:** Only run this in development/staging. Never seed production with demo data.

## Step 6: Verify Deployment

1. Visit your deployed URL
2. Test sign up and sign in
3. Verify admin access with your configured admin phone/email
4. Test core features (create chama, cycles, contributions)

## Monitoring & Maintenance

### Error Tracking

Consider setting up:
- Sentry for error tracking
- Vercel Analytics for performance monitoring

### Database Backups

Turso provides automatic backups. Configure backup retention in your Turso dashboard.

### SSL/TLS

Vercel automatically provides SSL certificates for your domain.

## Troubleshooting

### Build Failures

- Check environment variables are set correctly
- Verify database connection
- Review build logs in Vercel dashboard

### Runtime Errors

- Check server logs in Vercel dashboard
- Verify database migrations have run
- Ensure all environment variables are present

### Admin Access Issues

- Verify `ADMIN_EMAILS` or `ADMIN_PHONES` are set
- Check phone/email format matches exactly
- Ensure user status is 'active'

## Environment-Specific Configurations

### Development

```bash
NODE_ENV=development
```

### Production

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Security Checklist

- [ ] All environment variables are set
- [ ] Database credentials are secure
- [ ] Admin access is configured
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] Session secrets are random and secure
- [ ] SMS API credentials are protected
- [ ] Error tracking is configured

## Support

For issues or questions, refer to the project documentation or contact the development team.

