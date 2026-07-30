# The Redditrepreneur Newsroom

Private editorial operating system built with Next.js 16, Supabase, Ghost and Vercel.

## Data architecture

- Ghost at `blog.theredditrepreneur.com` is the publication source. Published articles are refreshed every five minutes through the Ghost Content API or its public RSS fallback.
- The existing Redditrepreneur Supabase project provides authentication and stores newsroom workflow, distribution, performance and repurposing records.
- The SQL migration in `drizzle-pg` can be applied to the Supabase Postgres database.

## Vercel configuration

Add the variables in `.env.example` under Project Settings → Environment Variables. At minimum, the app requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

For server-side writes, also add `SUPABASE_SERVICE_ROLE_KEY`. A Ghost Content API key is optional because the application falls back to the public Ghost RSS feed.

In Supabase Authentication → URL Configuration, add the production callback:

`https://editorial.theredditrepreneur.com/auth/callback`

Then redeploy and connect `editorial.theredditrepreneur.com` under Vercel Project Settings → Domains.

## Validation

Run `npm test` to execute linting, TypeScript checking and a production build.
