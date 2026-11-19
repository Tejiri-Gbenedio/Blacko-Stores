# Blacko Stores — Interactive Menswear Rail & Custom Bag

Nigerian contemporary men's shirting storefront built with Next.js App Router, Tailwind CSS, GSAP, Neon Serverless Postgres (Drizzle ORM), and Paystack (NGN).

## Quickstart

1. Install dependencies:
   ```bash
   npm install
   ```

2. Extract your Sky Floral Camp Shirt & Custom Weekender Bag sprites:
   - Drop `atelier-rack-prototype-v2.html` into `docs/`
   - Run:
   ```bash
   npm run assets:extract
   ```

3. Preview immediately (uses built-in Sky Floral fallback even before Neon is connected):
   ```bash
   npm run dev
   ```

4. Connect Neon Postgres & Paystack:
   - Copy `.env.example` to `.env.local` and paste your `DATABASE_URL` and `PAYSTACK_SECRET_KEY`.
   - Push schema and seed Drop 01:
   ```bash
   npm run db:push && npm run db:seed
   ```

5. Adding Shirt #2, #3, etc. later:
   - Put new 4-panel shirt boards in `raw_boards/`
   - Run `python scripts/slice_shirt_boards.py --input-dir ./raw_boards --output-dir ./public/assets/shirts`
   - Add the new shirt row to `db/seed.ts` and re-run `npm run db:seed`.
