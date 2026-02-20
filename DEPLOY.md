# Deployment Guide

This project is optimized for deployment on **Vercel** with a **Supabase** backend.

## Prerequisites

-   GitHub account
-   Vercel account
-   Supabase project

## 1. Environment Variables

Create a new project in Vercel and add the following environment variables (found in `.env.local`):

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID (Test/Live) |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret |
| `NEXT_PUBLIC_AUTH_BYPASS` | Set to `false` for Production |

## 2. Build Settings

-   **Framework Preset**: Next.js
-   **Build Command**: `next build` (Default)
-   **Output Directory**: `.next` (Default)
-   **Install Command**: `npm install` (Default)

## 3. Database Migration

Ensure your Supabase database has the required tables. Run the SQL migration scripts located in `supabase/migrations` (if applicable) or verify the schema matches the types in `src/types/index.ts`.

## 4. Admin Security

The `/admin` routes are protected by functionality in `src/middleware.ts`.
**Crucial**: Ensure your Supabase `profiles` table has a `role` column, and your admin user has `role: 'admin'`.

```sql
-- Example: Promote a user to admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## 5. Deploy

Push your code to GitHub and connect the repository to Vercel. Vercel will automatically build and deploy the application.
