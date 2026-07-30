# The Redditrepreneur Newsroom

Private editorial operating system for The Redditrepreneur, built with Next.js 16, Clerk, Neon Postgres, Drizzle and Vercel.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the existing Redditrepreneur Clerk publishable and secret keys.
3. Create or connect a Neon Postgres database and add its `DATABASE_URL`.
4. Run `npm install`, `npm run db:generate`, then `npm run dev`.

## Vercel deployment

1. Import `theredditrepreneur/editorial` in Vercel.
2. Keep the detected framework preset as Next.js and the build command as `npm run build`.
3. Add every variable from `.env.example` in Project Settings → Environment Variables.
4. Add a Neon integration or supply an existing Postgres `DATABASE_URL`.
5. Deploy, then add `editorial.theredditrepreneur.com` in Project Settings → Domains.
6. Add the DNS record Vercel supplies at the domain provider.

Clerk must list both the generated Vercel URL and `editorial.theredditrepreneur.com` as allowed production origins. The application protects all newsroom routes and exposes only `/sign-in` publicly.

## Validation

Run `npm test` to execute linting, TypeScript checking and a production Next.js build.
