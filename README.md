# ProBau.ch Frontend

Production-grade frontend architecture for a Swiss construction SaaS marketplace.

## Stack

- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS
- Modular component architecture

## Business roles

1. **Arbeitsgeber** (free)
   - Create projects
   - View own projects
   - Review received offers
2. **Unternehmer** (paid)
   - Browse projects
   - Submit offers (requires active subscription)
   - Manage subscription
   - Track own offers

## Project structure

```txt
app/
  (public)/
  (dashboard)/dashboard/
  api/auth/
components/
  auth/
  common/
  dashboard/
  forms/
  layout/
  marketing/
  projects/
  subscription/
  ui/
hooks/
lib/
types/
```

## Development

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - start local server
- `npm run build` - build production app
- `npm run start` - run production server
- `npm run lint` - run ESLint
