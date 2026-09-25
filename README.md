# Vichento

**Read. Write. Think deeper.** A Medium-style publishing platform built with Next.js 16 (App Router), Tailwind CSS v4 and Supabase.

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your Supabase URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The UI runs without a database. If the Supabase env vars are missing, the app
falls back to a placeholder client: public pages render and data lists show
their empty states.

## Project map

| Path | What it is |
| --- | --- |
| `src/app/page.js` | Landing page (signed out) / personalised feed (signed in) |
| `src/app/read/[slug]` | Story reader with likes, saves, share and responses |
| `src/app/(protected)/write` | Story editor (`/write` new, `/write/[id]` edit) |
| `src/app/(protected)/stories` | Your drafts & published stories |
| `src/app/(protected)/library` | Saved list + reading history |
| `src/app/(protected)/stats` | Author analytics (overall and per story) |
| `src/app/(protected)/explore`, `search` | Topic browsing & search |
| `src/app/profile/[username]` | Public profile + settings (`?settings=true`) |
| `src/app/signin`, `signup`, `forgot-password`, `reset-password`, `verify-email`, `auth/callback` | Auth flow |
| `src/app/components/editor/ArticleEditor.jsx` | The shared rich-text editor |
| `src/lib/constants.js` | Topic list (single source of truth) |
| `src/lib/articleUtils.js` | Image URLs, excerpts, reading time, dates, slugs, share |
| `src/context/AuthContext.js` | `user`, `profile`, `refreshProfile`, `signOut` |
| `src/context/ToastContext.js` | `useToast()` notifications |

## Database (Supabase) — what the code expects

**Tables**

- `users`: `id` (= auth user id), `email`, `name`, `username` (unique), `avatar`, `bio`, `about_rich`, `dob`, `profession`, `interests text[]`, `twitter`, `linkedin`, `instagram`, `website`
- `articles`: `id`, `author_id` → users (FK named `fk_author`), `title`, `slug` (unique), `content` (HTML), `meta_description`, `cover_image`, `categories text[]`, `status` (`draft` | `published`), `view_count`, `published_at`, `created_at`, `updated_at`, plus SEO columns `seo_title`, `seo_description`, `seo_slug`, `canonical_url`, `og_title`, `og_description`, `robots`, `twitter_card`, `schema_type`, `focus_keyword`, `nofollow_links`
- `likes`, `bookmarks`: `id`, `user_id`, `article_id`, `created_at` + analytics columns (see below)
- `views`: `id`, `article_id`, `user_id` (nullable), `unique_user`, `created_at` + analytics columns
- `comments`: `id`, `article_id`, `user_id`, `content`, `parent_id` (nullable, for replies), `created_at`
- `comment_likes`: `comment_id`, `user_id`
- `bug_reports`: see `BUG_REPORTS_SETUP.sql`
- `early_access`: `email` (unique), `name`, `created_at`

Analytics columns written by `buildAnalyticsPayload()`: `referrer`, `location`, `device_type`, `device_os`, `device_browser`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.

**Storage buckets** (public): `article-images` (covers + inline images), `avatars` (uploaded profile pictures), `user_avatars` (default avatars `1.png`–`12.png`, see `public/avatars`).

**Auth**: enable Email and Google providers. Add `<your-site>/auth/callback` and `<your-site>/reset-password` to the allowed redirect URLs.
