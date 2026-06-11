# JK-News Records

**Professional Workflow Management System for JK New**

Serving **200,000+ followers** with enterprise-grade task and content management.

JK News Records is a modern, intuitive workflow management application designed to streamline editorial operations, content production, and team collaboration. Built for high-performance teams, it provides real-time Kanban-style task tracking, comprehensive activity auditing, and role-based access control.

## Key Features

- **Interactive Kanban Board** – Visual workflow with Pending → In Progress → Done stages, drag & drop task management, and list view alternative
- **Comprehensive Record Management** – Serial numbering, content titles, voice-over toggles, and video status tracking
- **Secure Authentication** – NextAuth-powered login with email/password authentication
- **Role-Based Access Control** – Super admin capabilities for user management and system configuration
- **Full Audit Trail** – Complete activity logging with timestamps, user attribution, and change tracking
- **Real-Time Collaboration** – Multi-user support with instant updates and conflict prevention

## Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS
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
