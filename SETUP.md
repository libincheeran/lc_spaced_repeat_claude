# Setup & Deployment Guide

## Stack
- **Frontend + API**: Next.js 16 (App Router, TypeScript)
- **Database + Auth**: Supabase (PostgreSQL + Google OAuth)
- **Hosting**: Vercel (free tier)

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New Project**, give it a name (e.g. `lc-spaced-rep`), set a DB password, choose a region.
3. Wait ~1 minute for the project to provision.

### Run the schema

1. In your Supabase project, go to **SQL Editor**.
2. Paste the contents of `supabase/schema.sql` and click **Run**.
3. Then paste `supabase/migration_add_auth.sql` and click **Run**.

This creates:
- `problems` — stores each LC problem and review stage, scoped per user
- `review_history` — logs every solve/snooze action
- `settings` — per-user config (default snooze = 14 days)
- Row Level Security so each user only sees their own data
- A trigger that auto-creates settings for new sign-ups

### Get your credentials

In your Supabase project, go to **Project Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Enable Google OAuth in Supabase

1. In your Supabase project, go to **Authentication → Providers → Google**.
2. Enable Google and note the **Callback URL** shown (e.g. `https://xxxx.supabase.co/auth/v1/callback`).
3. Go to [Google Cloud Console](https://console.cloud.google.com):
   - Create a project (or use an existing one)
   - Go to **APIs & Services → OAuth consent screen** → configure as External
   - Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: paste the Supabase callback URL from above
   - Copy the **Client ID** and **Client Secret**
4. Back in Supabase, paste the Client ID and Client Secret, click **Save**.

### Configure redirect URLs in Supabase

Go to **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (update to your Vercel URL after deploy)
- **Redirect URLs**: add `http://localhost:3000/auth/callback` and `https://your-app.vercel.app/auth/callback`

---

## Step 3 — Configure environment variables locally

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Test locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## Step 4 — Deploy to Vercel

### Option A: Via Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option B: Via GitHub + Vercel dashboard

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), click **Add New Project**, import your repo.
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.

After deploy, update **Supabase → Authentication → URL Configuration**:
- Site URL → your Vercel URL
- Add your Vercel URL `/auth/callback` to Redirect URLs

Vercel will auto-deploy on every push to `main`.

---

## Review Schedule

| Stage | When it fires |
|-------|--------------|
| 3 Days | 3 days after adding the problem |
| 3 Weeks | 3 weeks after solving the 3-day review |
| 3 Months | 3 months after solving the 3-week review |
| Queue | After 3-month review — FIFO queue, manual pick |

**Snooze**: Pushes `next_review_date` forward by N days (default: 14). Stage is preserved.
