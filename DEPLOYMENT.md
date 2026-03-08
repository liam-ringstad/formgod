# FormGod AI – Deployment Guide

This guide covers everything needed to deploy FormGod AI to production.

## 1. Supabase Setup
1. Create a new project on [Supabase.com](https://supabase.com/).
2. Navigate to **SQL Editor** and execute the contents of `supabase/migrations/001_initial_schema.sql`.
   - This creates the `profiles`, `analyses`, and `referrals` tables.
   - It sets up Row Level Security (RLS) policies.
   - It creates the auto-profile trigger on signup.
   - It creates the `formgod` storage bucket.
3. In **Authentication -> Providers**, enable **Email** and **Google**. For Google, configure the OAuth Client ID and Secret from your Google Cloud Console.
4. Go to **Project Settings -> API** to get your `URL`, `anon` key, and `service_role` key.

## 2. Stripe Setup
1. Create a new product on [Stripe](https://stripe.com) named "FormGod Pro" (e.g., $19/month recurring).
2. Note the Price ID (starts with `price_...`).
3. Note your Secret Key (`sk_live_...` or `sk_test_...`) and Publishable Key (`pk_...`).
4. Set up an endpoint webhook pointing to `https://yourdomain.com/api/stripe/webhooks`.
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Reveal the Webhook Signing Secret (`whsec_...`).

## 3. Replicate Setup (AI Coaching)
1. Create an account on [Replicate.com](https://replicate.com/).
2. Grab your API token. The app uses `meta/meta-llama-3-8b-instruct`.

## 4. Vercel Deployment
1. Push this repository to GitHub/GitLab.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Set the Build Command to `npm run build`.
4. Add the following Environment Variables in Vercel:
   - `NEXT_PUBLIC_APP_URL` (e.g., `https://formgod.ai`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID` (the Price ID for the Pro tier)
   - `REPLICATE_API_TOKEN`
5. Click **Deploy**.

## 5. Testing & Verification
- Create a test account.
- Analyze a video in the `Analyze` tab (requires camera access on https).
- Generate a 15s Reel export on the results page.
- Test the Stripe checkout flow using test cards.

_Note: SharedArrayBuffer is required for FFmpeg.wasm video exports. The `next.config.ts` includes `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers to enable this._
