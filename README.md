# UGC Portfolio Starter

Creative, multi-page portfolio infrastructure for a beginner UGC creator + photographer.

## Backend Recommendation

Use your existing Strapi backend first.

Why this is the right starting point:
- You already run Strapi with Cloudinary + Postgres, so this lowers hosting and setup cost.
- You can publish/edit content quickly through CMS workflows.
- This frontend uses a backend adapter (`mock | strapi | custom`) so you can switch to a separate backend later without rewriting the UI.

Use a separate backend only when you need custom logic or architecture that Strapi cannot support cleanly.

## Implemented Pages

- Home
- UGC Services
- Portfolio
- About
- Contact

Included presentation features:
- Editorial layout + strong typography
- Warm neutral palette + deep green accent
- Scrolling marquee
- Hook ideas cards
- 3 featured UGC video case cards
- Photography filter tabs (Product, Lifestyle, Food, Travel)
- Package cards with starter-friendly badge

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 via `@tailwindcss/vite`
- React Router
- Adapter-based API clients:
  - `mock`
  - `strapi`
  - `custom`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
copy .env.example .env
```

3. Run local dev:

```bash
npm run dev
```

## Environment Variables

```env
VITE_BACKEND_MODE=mock
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_TOKEN=
VITE_CUSTOM_API_URL=http://localhost:4000/api
VITE_UPLOAD_STAGE=local
```

Behavior:
- `mock`: local starter content
- `strapi`: reads from Strapi collections
- `custom`: reads from custom API routes
- `VITE_UPLOAD_STAGE`: upload scope prefix used for Cloudinary/Bunny folders (for example `local`, `staging`, `prod`)

If `VITE_BACKEND_MODE` is not set:
- uses `strapi` when `VITE_STRAPI_URL` exists
- otherwise uses `mock`

## Strapi Endpoints Used

- `/api/portfolio-items?populate=*`
- `/api/services?populate=*`
- `/api/testimonials?populate=*`

`portfolio-items` can include optional fields used by this UI:
- `kind` (`video` or `photo`)
- `formatType`, `whatPracticed`, `goal`, `style`, `deliverablesIncluded`
- `photoCategory` (`Product | Lifestyle | Food | Travel`)
- `caption`

## Project Structure

```text
src/
  App.tsx
  components/
  config/env.ts
  content/
  context/
  data/mockPortfolioData.ts
  hooks/usePortfolioData.ts
  lib/api/
  pages/
  types/portfolio.ts
```

## Commands

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm run preview`

## Deployment Routing (SPA)

This app uses `BrowserRouter`, so direct URLs like `/admin/login` require a rewrite to `index.html`.

- Vercel: `vercel.json` is included with a catch-all rewrite.
- Netlify: `public/_redirects` is included and copied to build output.

Without this, deep links refresh to host-level 404 pages.
