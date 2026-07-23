# Car Plus

A car dealership website for a Phnom Penh dealer. Visitors browse the car
inventory and save favourites; admins manage cars, contact details, and
promotions from a built-in admin panel. The customer-facing UI is in Khmer.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Storage, Row Level Security)
- React Router + TanStack Query

## Getting started

Prerequisites: Node.js and npm.

```sh
# 1. Install dependencies
npm install

# 2. Set your Supabase credentials in .env (see below)

# 3. Start the dev server (http://localhost:8080)
npm run dev
```

### Environment variables (.env)

```
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your anon / publishable key>"
```

Only these two are required by the app. The anon key is safe to expose in the
browser; the data is protected by Row Level Security in the database.

## Database setup (Supabase)

1. Create a new Supabase project.
2. Open the SQL Editor and run the entire `supabase_setup.sql` file. This
   creates all tables, RLS policies, the `car-images` storage bucket, and
   indexes. It is safe to re-run.
3. Copy the Project URL and anon key from Project Settings -> API into `.env`.

## Making yourself an admin

For security, admins cannot be created through the app. Sign up on the site
first, then run this in the Supabase SQL Editor:

```sql
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'you@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

Refresh the site and a gear icon appears in the header, linking to `/admin`.

## What the admin can do

- Add, edit, and delete cars (with photo upload to Supabase Storage)
- Edit contact info (phone, Telegram, Facebook, address, Google Map)
- Set a site-wide promotion banner
- View orders and reports

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - production build
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint

## Project structure

- `src/pages` - routes (home, car detail, auth, admin pages)
- `src/components` - UI components and admin dialogs
- `src/hooks` - data hooks (useCars, useAuth, useContact, useWishlist, ...)
- `src/integrations/supabase` - Supabase client and generated types
- `supabase_setup.sql` - full database schema, policies, and storage setup
- `PROGRESS.txt` / `BUGLOG.txt` - shared work log and bug log

## Deployment

The app builds to static files (Vite). Deploy the `dist/` output to any static
host such as Vercel. A `vercel.json` is included with an SPA rewrite so
client-side routes work on refresh. Set the same `VITE_SUPABASE_*` environment
variables in the host.

## Notes

- The customer-facing UI is in Khmer; some admin labels are English.
- Cart and wishlist currently use the browser's local storage per signed-in user.
