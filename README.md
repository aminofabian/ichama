# Merry Chama Platform

A digital platform for managing chamas (savings groups) in Kenya. Track contributions, manage cycles, and ensure transparency in your merry-go-round groups.

## Features

- 📱 **Phone-based Authentication** - Sign up and sign in using phone numbers with OTP verification
- 🏦 **Chama Management** - Create and manage savings groups (savings, merry-go-round, hybrid)
- 🔄 **Cycle Management** - Set up contribution cycles with turn-based payouts
- 💰 **Contributions & Payouts** - Track member contributions and manage payouts
- 📊 **Dashboard** - Overview of your chamas, cycles, and financial status
- 💳 **Savings & Wallet** - Personal savings tracking and wallet transactions
- 📜 **History** - Complete historical records of all activities
- 🔔 **Notifications** - Real-time notifications for important events
- 👤 **Profile Management** - Update profile and security settings
- 🛡️ **Admin Dashboard** - Platform-wide management for super admins

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Database:** Turso (libSQL)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Authentication:** Session-based with OTP

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Turso database account
- SMS API credentials (for OTP)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ichama
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```bash
TURSO_DATABASE_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your-auth-token
SMS_API_URL=your-sms-api-url
SMS_API_KEY=your-sms-api-key
ADMIN_PHONES=+254712345678
```

4. Run database migrations:
```bash
bun run db:migrate
```

5. (Optional) Seed demo data:
```bash
bun run db:seed
```

6. Start the development server:
```bash
bun run dev
# or
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

After running the seed script, you can use:

- **Phone:** 254712345678
- **Password:** demo123

## Project Structure

```
ichama/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages (protected)
│   ├── (public)/          # Public pages
│   └── admin/             # Admin pages (protected)
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── chama/            # Chama-related components
│   ├── cycle/            # Cycle-related components
│   └── shared/           # Shared components
├── lib/                   # Utility libraries
│   ├── auth/             # Authentication logic
│   ├── db/               # Database queries and migrations
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
└── scripts/              # Database scripts
    ├── migrate.ts        # Run migrations
    └── seed.ts           # Seed demo data
```

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed demo data

## Admin Access

To enable admin access, set `ADMIN_EMAILS` or `ADMIN_PHONES` in your environment variables:

```bash
ADMIN_PHONES=+254712345678,+254798765432
```

Admin users can then access `/admin` routes.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## License

[Add your license here]

## Support

For issues or questions, please open an issue on GitHub.
