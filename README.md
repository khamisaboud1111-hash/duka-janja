# Duka Janja — Zanzibar's Online Marketplace

A production-ready, mobile-first multivendor e-commerce platform for Zanzibar, built with Next.js 14, Supabase, and Tailwind CSS.

🇹🇿 Bilingual (Swahili / English) · 💳 M-Pesa / Tigo Pesa / Airtel Money / Halopesa · 🚚 Zanzibar delivery zones · 🏪 Multivendor with seller approval workflow

---

## Tech Stack

| Layer          | Technology                                  |
|----------------|----------------------------------------------|
| Framework      | Next.js 14 (App Router)                      |
| Language       | TypeScript                                    |
| Styling        | Tailwind CSS                                  |
| Database       | Supabase (PostgreSQL)                         |
| Auth           | Supabase Auth                                 |
| File storage   | Supabase Storage                              |
| State          | Zustand (cart, language) + React Query patterns via hooks |
| Forms          | react-hook-form + zod                         |
| Deployment     | Vercel                                        |

---

## Folder Structure

```
duka-janja/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Login, register, forgot password
│   │   ├── (marketplace)/           # Public buyer-facing pages
│   │   │   ├── page.tsx             # Homepage
│   │   │   ├── products/[id]/       # Product detail
│   │   │   ├── sellers/[id]/        # Seller storefront
│   │   │   ├── search/              # Browse/filter
│   │   │   ├── checkout/            # Cart → order
│   │   │   ├── orders/              # Buyer order history + tracking
│   │   │   ├── wishlist/
│   │   │   └── notifications/
│   │   ├── (seller)/seller/         # Seller dashboard (protected)
│   │   │   ├── dashboard/
│   │   │   ├── products/            # CRUD + new/edit
│   │   │   ├── orders/              # Fulfillment workflow
│   │   │   ├── analytics/
│   │   │   └── settings/            # Store profile + onboarding
│   │   ├── (admin)/admin/           # Admin dashboard (protected)
│   │   │   ├── dashboard/
│   │   │   ├── sellers/             # Approve/suspend
│   │   │   ├── products/            # Moderation
│   │   │   ├── orders/
│   │   │   └── commissions/
│   │   └── api/                     # REST API routes (mirror of hooks, for external use)
│   ├── components/
│   │   ├── ui/                      # Button, Input, Badge, Modal, StarRating...
│   │   ├── layout/                  # Navbar
│   │   ├── product/                 # ProductCard, ReviewForm
│   │   ├── seller/                  # ProductForm
│   │   ├── order/                   # OrderTracker
│   │   └── shared/                  # ImageUploader
│   ├── hooks/                       # useUser, useProducts, useOrders, useSeller, useNotifications, useReviews
│   ├── lib/supabase/                # client.ts (browser), server.ts (RSC)
│   ├── store/                       # Zustand: cart + language
│   ├── i18n/                        # Swahili/English translations
│   ├── types/                       # Shared TypeScript types
│   ├── utils/                       # formatTZS, delivery zones, slugify, etc.
│   └── middleware.ts                # Route protection (seller/admin/auth)
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # Tables, RLS policies, triggers
│   │   └── 002_storage_and_functions.sql  # Storage buckets, RPC functions
│   └── seed/
│       ├── categories.sql
│       └── make_admin.sql
├── public/
├── next.config.js
├── tailwind.config.ts
├── vercel.json
└── package.json
```

---

## Database Schema Overview

| Table              | Purpose                                                    |
|---------------------|-------------------------------------------------------------|
| `profiles`           | All users (buyer/seller/admin), auto-created on signup     |
| `sellers`            | Store profiles, approval status, commission rate, ratings  |
| `categories`         | Product categories (bilingual names)                       |
| `products`           | Listings with stock, pricing, Zanzibar-made flag            |
| `product_images`     | Multiple images per product via Supabase Storage            |
| `orders`             | Buyer orders with delivery zone, payment method              |
| `order_items`        | Line items per order, linked to seller for multivendor split |
| `order_tracking`     | Status history (Pending → Confirmed → Packed → Out for Delivery → Delivered) |
| `commissions`        | Per-order, per-seller commission records for payout tracking |
| `reviews`            | Product reviews tied to delivered orders (1 review per order/product) |
| `wishlists`          | Saved products per buyer                                    |
| `notifications`      | Bilingual in-app notifications with read state               |
| `delivery_zones`     | Zanzibar zones with fees (Stone Town, Pemba, etc.)            |

Row Level Security (RLS) is enabled on every table — buyers see only their own orders, sellers see only their own products/orders, admins see everything via an `is_admin()` helper function.

---

## Setup Instructions

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project. Note your project URL and anon key.

### 2. Run the database migrations

In the Supabase SQL Editor, run in order:

```sql
-- 1. Paste and run supabase/migrations/001_initial_schema.sql
-- 2. Paste and run supabase/migrations/002_storage_and_functions.sql
-- 3. Paste and run supabase/seed/categories.sql
```

### 3. Verify storage buckets

Go to Storage in the Supabase dashboard and confirm these buckets exist (created by migration 002):
- `product-images` (public)
- `seller-logos` (public)
- `seller-banners` (public)
- `avatars` (public)

### 4. Configure environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find these under Supabase → Project Settings → API.

### 5. Install dependencies and run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

### 6. Create your first admin user

1. Register a normal account through the app at `/register`.
2. In Supabase SQL Editor, run `supabase/seed/make_admin.sql` with that email.
3. Log out and back in — you'll now see the Admin link in your profile menu.

### 7. Test the seller flow

1. Register a second account choosing "Muuzaji" (Seller).
2. Complete the store settings form (logo, banner, WhatsApp number).
3. As the admin, go to `/admin/sellers` and approve the pending seller.
4. As the seller, add products at `/seller/products/new`.
5. As a buyer, browse, add to cart, and checkout.

---

## Deployment to Vercel

### Option A — CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts, then set environment variables:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel --prod
```

### Option B — Dashboard

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add environment variables in Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` → your production URL (e.g. `https://dukajanja.co.tz`)
5. Deploy.

### Post-deploy checklist

- [ ] Update Supabase Auth → URL Configuration → Site URL to your production domain
- [ ] Add production domain to Supabase Auth → Redirect URLs (`https://yourdomain.com/api/auth/callback`)
- [ ] Test signup/login flow end-to-end on production
- [ ] Test image upload (product, logo, banner) on production
- [ ] Place a test order through the full checkout flow
- [ ] Verify seller order status updates trigger buyer notifications

---

## Key Business Logic

**Commission**: Currently flat 5% per order line item, calculated and stored in the `commissions` table at checkout time. Admins can mark commissions as paid in `/admin/commissions`. To support per-category or per-seller rates, update the `commission_rate` column on `sellers` and reference it in `src/app/(marketplace)/checkout/page.tsx` instead of the hardcoded `0.05`.

**Delivery zones & fees** are defined in two places that must stay in sync:
- `supabase/migrations/001_initial_schema.sql` → `delivery_zones` table (source of truth for backend)
- `src/utils/index.ts` → `DELIVERY_ZONES` constant (used for client-side calculation before order submission)

**Order status flow**: `pending → confirmed → packed → out_for_delivery → delivered`, with `cancelled`/`refunded` as terminal off-path states. Stock is automatically restored via a Postgres trigger if an order is cancelled, and seller totals are automatically incremented when an order is marked delivered.

**Stock management**: Decremented atomically via the `decrement_stock()` Postgres function at order creation to prevent race conditions between simultaneous buyers.

---

## Environment Variables Reference

| Variable                          | Where to find it                                | Required |
|------------------------------------|--------------------------------------------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL`         | Supabase → Settings → API → Project URL          | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | Supabase → Settings → API → anon/public key      | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`        | Supabase → Settings → API → service_role key     | Yes (server-side admin ops) |
| `NEXT_PUBLIC_APP_URL`              | Your deployed URL                                 | Yes      |

⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client — it's only used in server contexts.

---

## What's Intentionally Postponed (per current scope)

- AI chat assistant
- Tourism marketplace section
- Real payment gateway integration (M-Pesa/Tigo Pesa/Airtel/Halopesa are currently captured as a reference number at checkout for manual confirmation — integrate Selcom, Flutterwave, or a local mobile money aggregator API for automated capture)
- SMS notifications (currently in-app only — wire up Africa's Talking or similar for SMS)
- Real-time chat between buyer and seller (WhatsApp deep links are used instead)

---

## License

Proprietary — built for Duka Janja.
