# Badminton Planner

Free Xoyondo-style weekly badminton planner using Next.js + Supabase, with optional Google Sheets export.

## 1. Install
```bash
npm install
npm run dev
```

## 2. Supabase
Create a free Supabase project and run `supabase/schema.sql` in the SQL editor.

Copy `.env.example` to `.env.local` and fill Supabase keys.

## 3. Google Sheets export
Create a Google Cloud service account, enable Google Sheets API, share your Google Sheet with the service account email, and fill the Google env vars.

Call:
```bash
curl "http://localhost:3000/api/export-week?secret=YOUR_SECRET"
```

On Vercel, add a weekly Cron Job hitting `/api/export-week?secret=...`.
