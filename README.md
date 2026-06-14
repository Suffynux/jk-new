<p align="center">
  <img src="public/jk_news_logo_component_rectangular.png" alt="JK News" width="120" />
</p>

<h1 align="center">JK News Records</h1>

<p align="center"><b>The production workflow tracker built especially for JK News.</b></p>

## About this project

I built **JK News Records** specifically for **[JK News](https://www.facebook.com/jknewstvofficial/reels/)** to manage their day-to-day news production — tracking every story from the moment work begins until it goes on air and is finished.

JK News is a Jammu & Kashmir news channel serving **200,000+ followers** on Facebook with breaking news, reels, analysis, and exclusive coverage. Their team needed a simple, mobile-first way to see what each report is doing right now, who is working on it, and how long it takes to get a story to air. This app is that tool: a real-time Kanban board, stage-by-stage progress, and built-in timing — designed first for phones, because that is where the team actually works.

> 🔗 **JK News on Facebook:** https://www.facebook.com/jknewstvofficial/reels/

## Key Features

- **5-stage production pipeline** – A Kanban board that follows a story through its real lifecycle: **In Progress → Voice Over → Video / Editing → On Air → Done**, with drag & drop on desktop and swipeable columns on mobile.
- **Automatic time tracking** – A timer starts the moment a news item is created (In Progress) and stops when it is marked **Done**. The total turnaround time is calculated and stored, and live elapsed time is shown on every card until it is finished.
- **Per-item progress** – Each news card shows a progress bar and percentage derived from its current stage, so you can see at a glance how far along every story is.
- **Light & dark themes** – A white/light theme by default with a one-tap dark mode toggle in the navbar. Your choice is remembered and applied before the page paints (no flash).
- **Mobile-first, responsive design** – The whole board is built to be used on phones first, then scales up to tablet and desktop.
- **Brand identity** – Colors and logo taken straight from the JK News brand.
- **Secure authentication** – NextAuth-powered email/password login.
- **Role-based access control** – Super admin capabilities for user management.
- **Full audit trail** – Every change (status moves, completions, edits) is logged with the user and a timestamp.

## Workflow & timing

Each news item moves through five stages. Progress is derived from the stage:

| Stage | Progress |
|-------|----------|
| In Progress | 20% |
| Voice Over | 40% |
| Video / Editing | 60% |
| On Air | 80% |
| Done | 100% |

The **clock starts** when an item is created (it enters *In Progress*) and **stops** when it reaches *Done*. The elapsed turnaround is saved on the record (`startedAt`, `completedAt`, `durationMs`) and surfaced both live on the board and in the activity log.

## Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend:** Node.js, Next.js API Routes
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** NextAuth v4
- **Deployment:** Optimized for Vercel

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free tier available)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone git@github.com:Suffynux/jk-new.git
   cd jk-new
   npm install
   ```

2. **Configure environment variables** in `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/jk-news?retryWrites=true&w=majority
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   SUPER_ADMIN_PASSWORD=ChangeMe@123
   ```

3. **Initialize the database** with super admin account:
   ```bash
   npm run seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and log in.

## Application Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Authenticated Users | Kanban board & list view of all workflow records |
| `/activity` | Authenticated Users | Complete activity log and audit trail |
| `/users` | Super Admin | User management - create, remove, and configure team members |

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

### Vercel (Recommended)

The application is fully optimized for Vercel deployment. Configure these environment variables in your Vercel project:

- `MONGODB_URI` – MongoDB Atlas connection string
- `NEXTAUTH_SECRET` – Secure random string for session encryption
- `NEXTAUTH_URL` – Your production URL

Push to main branch and Vercel will auto-deploy.

### Other Platforms

Ensure Node.js 18+ runtime and set all environment variables before deployment.

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes (auth, news, activity)
│   ├── globals.css              # Global styling
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── lib/
│   ├── auth.ts                  # NextAuth configuration
│   └── db.ts                    # Database connection
├── models/                       # Mongoose schemas
│   ├── User.ts
│   ├── NewsItem.ts
│   └── Activity.ts
└── types/                        # TypeScript type definitions
```

## Contributing

For team members and contributors, please follow the existing code style and ensure all tests pass before submitting pull requests.

## License

Proprietary - JK New

## Support

For issues, feature requests, or questions, please contact the development team.
