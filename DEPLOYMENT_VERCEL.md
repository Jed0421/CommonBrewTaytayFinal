# Finish the CommonBrew Vercel deployment

The project open in VS Code has been edited. No Render configuration is used. The live website has not been deployed or verified.

## 1. Apply the new session-storage migration

Open the SAME Supabase project used by your existing CommonBrew data. Open SQL Editor, create a new query, paste `01-supabase-session-storage.sql`, and Run.

The same SQL is in your repository at `supabase/migrations/20261109_vercel_server_state.sql`.

This creates one server-only table for login sessions and verification codes. It does not replace existing users, passwords, products, or inventory. Do not rerun your entire original schema or delete your database.

## 2. Check Vercel environment variables

Open the CommonBrew project in Vercel, Settings, Environment Variables. Set these for the environments you will deploy (Preview and Production):

| Name | Value |
| --- | --- |
| SUPABASE_URL | Your existing Supabase project URL |
| SUPABASE_SERVICE_KEY | That project's secret/service-role key; server-only Secret |
| VITE_SUPABASE_URL | Same project URL; public Config |
| VITE_SUPABASE_ANON_KEY | That project's publishable/anon key; public Config |

`SUPABASE_SERVICE_ROLE_KEY` is also accepted as a server-key alias. Never prefix a server secret with VITE_. Never paste secret values into chat or commit `.env`.

Keep any existing email/SMS variables needed for registration and password reset.

Important: CommonBrew's existing custom login reads `public.users` with `username`, `role`, and `password_hash`. A person appearing only in Supabase Authentication > Users is not automatically a CommonBrew account. Existing CommonBrew password hashes are preserved; no accounts are seeded during Vercel startup.

## 3. Test in the VS Code terminal

From the project folder, run these one at a time:

```powershell
npm run lint
npm run test:vercel
npm run build
```

The integration test substitutes a fake Supabase service and does not read or write your real database. It checks products, incorrect passwords, staff/customer login, cross-instance sessions, logout, database failures, profile persistence, verification-code sharing and expiration.

## 4. Review and push the code to a Preview branch

Use Source Control in VS Code to review the changes. Your previously modified `dist` output was left alone.

For a new Preview branch:

```powershell
git switch -c fix/vercel-supabase-api
```

Stage only these files (not `.env`, and not the existing generated `dist` changes):

```powershell
git add server.ts package.json tsconfig.json vercel.json api/index.ts src/lib/supabase.ts src/lib/serverStore.ts src/lib/databaseTasks.ts src/db/supabaseSync.ts supabase/migrations/20261109_vercel_server_state.sql tests/vercel.integration.mjs DEPLOYMENT_VERCEL.md
git commit -m "Deploy CommonBrew API on Vercel with Supabase sessions"
git push -u origin fix/vercel-supabase-api
```

If this branch already exists, use a new unused branch name. These commands have NOT been run for you.

In Vercel use the repository folder containing `package.json` as Root Directory, Vite as Framework Preset, `npm run build` as Build Command, and `dist` as Output Directory. The new `vercel.json` routes `/api/*` to the Express function and page navigation to Vite's frontend.

## 5. Test the Preview deployment

Open the Preview URL and check:

1. `/api/health`: JSON response, not HTML or Vercel 404.
2. `/api/products`: JSON records from your actual Supabase products table.
3. Product Showcase: products appear.
4. Log in with an existing CommonBrew staff/customer account; refresh and verify you stay signed in.
5. Sign out and verify protected requests reject that token.
6. Test registration, password reset, and a test order before merging to the production branch.

`/api/inventory` is protected. A 401 while signed out is expected; do not make that route public to remove the error.

If API initialization returns 503, open Vercel's Runtime Logs. Check missing variables, incorrect project/key, or missing database tables. If login reports session storage unavailable, apply the SQL migration in step 1. An empty products response means the configured database has no product records; the application no longer substitutes demo products in Vercel.

## What changed

- Added `api/index.ts` and Vercel routing.
- Split Express creation from the local listener; Vercel does not start Vite or a permanent listener.
- Each function invocation loads an isolated database snapshot before handling a request.
- Replaced Vercel's in-memory session/OTP storage with the server-only Supabase table.
- Waits for tracked database writes before sending JSON responses, and returns an error if they fail.
- Disabled the permanent backend SSE connection and background synchronization inside Vercel Functions; direct browser Supabase realtime remains available.
- Removed the hard-coded Supabase project fallback and made client/server variable handling explicit.
- Kept the local Node server available through `npm run dev` or `npm start`.

## Verification and limits

TypeScript checking and mocked API integration tests passed. Vite's production build could not run in the agent environment because its esbuild subprocess hit a filesystem access restriction; run `npm run build` locally before deploying.

No live Supabase connection, SQL migration, Vercel deployment, or real-account login has been verified. Existing order/inventory operations still use read-modify-write logic rather than database transactions; concurrent checkout correctness requires a separate transactional database change. The in-process rate limiter is not a global rate limit across all Vercel instances. Test the complete order flow on Preview before using production.
