# JK-News Records

A simple workflow tracker for the studio — replaces the paper register for news/report records.

- **Kanban board** (Pending → In Progress → Done) with drag & drop, plus a **List view**
- Each record: **Sr number**, **News name**, **Voice over** toggle, **Video status**
- **Login required** (NextAuth, email + password)
- **Super admin** can create/remove team users
- **Activity log** — every status change, voice-over toggle, create/delete is recorded with who did it and when

Built with Next.js (App Router), MongoDB (Mongoose), NextAuth, Tailwind CSS.

## Setup

1. **Add your MongoDB Atlas connection string** to `.env.local`:

   ```
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/jk-news?retryWrites=true&w=majority
   ```

   (In Atlas: Database → Connect → Drivers → copy the string, replace the password. Also allow your IP in Network Access.)

2. **Create the super admin account** (`usamakhizer786@gmail.com`):

   ```bash
   npm run seed
   ```

   Default password is `ChangeMe@123` (set in `.env.local` as `SUPER_ADMIN_PASSWORD` — change it and re-run seed to update).

3. **Run the app**:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and log in.

## Pages

| Page | Who | What |
|---|---|---|
| `/` | everyone logged in | Kanban + list view of news records |
| `/activity` | everyone logged in | Full activity log |
| `/users` | super admin only | Create / remove team users |

## Deploying

Works on Vercel out of the box. Set these environment variables in the Vercel project:
`MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production URL).
